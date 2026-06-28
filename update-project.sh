#!/bin/bash
# update-project.sh — Download, deploy, and restart NoNote
# Usage: update-project.sh <zip_url_or_file> <project_folder>
# Example: ~/update-project.sh http://192.168.0.99:8000/nonote-v5.49.2.zip /opt/NoNote
set -euo pipefail

R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m' B='\033[0;34m' W='\033[1;37m' N='\033[0m'
info()    { echo -e "${B}ℹ${N}  $*"; }
ok()      { echo -e "${G}✔${N}  $*"; }
warn()    { echo -e "${Y}⚠${N}  $*"; }
die()     { echo -e "${R}✘${N}  $*" >&2; exit 1; }
section() { echo -e "\n${W}── $* ${N}"; }

ZIP="${1:-}"
DEST="${2:-}"
[[ -z "$ZIP"  ]] && die "Missing zip.\nUsage: $0 <zip_url_or_file> <project_folder>"
[[ -z "$DEST" ]] && die "Missing destination.\nUsage: $0 <zip_url_or_file> <project_folder>"
DEST="$(realpath "$DEST" 2>/dev/null || echo "$DEST")"
[[ -d "$DEST" ]] || die "Destination does not exist: $DEST"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# ── Download ──────────────────────────────────────────────────
section "Prepare"
if [[ "$ZIP" == http* ]]; then
  info "Downloading $ZIP"
  if command -v curl &>/dev/null; then
    curl -fsSL --progress-bar "$ZIP" -o "$TMP/update.zip" || die "Download failed"
  elif command -v wget &>/dev/null; then
    wget -q --show-progress "$ZIP" -O "$TMP/update.zip" || die "Download failed"
  else
    die "Neither curl nor wget found"
  fi
else
  [[ -f "$ZIP" ]] || die "File not found: $ZIP"
  cp "$ZIP" "$TMP/update.zip"
fi
ok "Zip ready ($(du -sh "$TMP/update.zip" | cut -f1))"

# ── Validate ──────────────────────────────────────────────────
python3 -c "
import zipfile, sys
try:
    with zipfile.ZipFile('$TMP/update.zip') as z:
        bad = z.testzip()
        if bad: print(f'Corrupt entry: {bad}', file=sys.stderr); sys.exit(1)
except zipfile.BadZipFile as e:
    print(f'Bad zip: {e}', file=sys.stderr); sys.exit(1)
" || die "Zip validation failed"
ok "Zip is valid"

# ── Extract ───────────────────────────────────────────────────
section "Extract"
python3 -c "
import zipfile
with zipfile.ZipFile('$TMP/update.zip') as z:
    z.extractall('$TMP/extracted')
" || die "Extraction failed"

INNER=""
for entry in "$TMP/extracted"/*/; do
  name="$(basename "$entry")"
  [[ "$name" == __MACOSX ]] && continue
  [[ -d "$entry" ]] || continue
  if [[ -n "$INNER" ]]; then
    die "Zip contains multiple top-level folders — expected exactly one.\nFound: $INNER, $name"
  fi
  INNER="$entry"
done
[[ -z "$INNER" ]] && die "No top-level folder found inside zip"
[[ -f "$INNER/docker-compose.yml" ]] || warn "docker-compose.yml not found — is this the right package?"
ok "Extracted: $(basename "$INNER")"

# ── Backup ────────────────────────────────────────────────────
section "Backup"
BACKED=()
backup_if_exists() {
  local src="$1" dst="$2"
  if [[ -e "$src" ]]; then
    mkdir -p "$(dirname "$dst")"
    cp -r "$src" "$dst"
    BACKED+=("$src")
  fi
}
backup_if_exists "$DEST/.env"        "$TMP/backup/.env"
backup_if_exists "$DEST/nginx/certs" "$TMP/backup/certs"
[[ ${#BACKED[@]} -gt 0 ]] && ok "Backed up: ${BACKED[*]}" || warn "No sensitive files to back up"

# ── Deploy ────────────────────────────────────────────────────
section "Deploy"
rsync -a --delete \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='nginx/certs' \
  --exclude='postgres/data' \
  --exclude='node_modules' \
  --exclude='dist' \
  "$INNER/" "$DEST/" 2>/dev/null || {
  warn "rsync not available, falling back to cp"
  cp -r "$INNER/." "$DEST/"
}
ok "Files deployed to $DEST"

# ── Restore ───────────────────────────────────────────────────
section "Restore"
[[ -e "$TMP/backup/.env"   ]] && cp -r "$TMP/backup/.env"   "$DEST/.env"   && ok "Restored: .env"
[[ -e "$TMP/backup/certs"  ]] && cp -r "$TMP/backup/certs"  "$DEST/nginx/certs" && ok "Restored: nginx/certs"

# ── Git ───────────────────────────────────────────────────────
section "Git"
cd "$DEST"
if ! git rev-parse --git-dir &>/dev/null; then
  warn "Not a git repo — skipping push"
else
  VERSION="$(basename "$INNER")"
  git add -A
  if git diff --cached --quiet; then
    info "No changes to commit"
  else
    git commit -m "deploy: $VERSION"
    if git remote get-url origin &>/dev/null; then
      git push origin "$(git rev-parse --abbrev-ref HEAD)" && ok "Pushed to remote"
    else
      warn "No git remote — commit created but not pushed"
    fi
  fi
fi

# ── Restart ───────────────────────────────────────────────────
section "Restart"
if ! command -v docker &>/dev/null; then
  warn "docker not found — skipping restart"
elif [[ ! -f "$DEST/docker-compose.yml" ]]; then
  warn "docker-compose.yml not found — skipping restart"
else
  cd "$DEST"
  info "Stopping containers..."
  docker compose down
  info "Building and starting containers..."
  docker compose up -d --build --remove-orphans
  ok "Containers restarted"
fi

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${G}  ✔  Deploy complete: $(basename "$INNER")${N}"
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
