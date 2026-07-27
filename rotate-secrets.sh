#!/usr/bin/env bash
# NodeMap — Secret rotation script
# Usage: bash rotate-secrets.sh [--admin-password]
#
# Rotates JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, REDIS_PASSWORD and
# POSTGRES_PASSWORD in place. Pass --admin-password to also rotate the
# admin account's password (prompts interactively).
#
# Must be run on the host that runs `docker compose` for this stack —
# it operates on the live containers and the live .env file.

set -euo pipefail

BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

echo ""
echo -e "${BOLD}${CYAN}⬡  NodeMap Secret Rotation${RESET}"
echo "────────────────────────────────────────"

if [ ! -f .env ]; then
  echo -e "${RED}✗${RESET} .env not found. Run setup.sh first."
  exit 1
fi

for cmd in docker openssl; do
  command -v "$cmd" &>/dev/null || { echo -e "${RED}✗${RESET} $cmd not found."; exit 1; }
done

# ── Backup current .env ─────────────────────────────────────────
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP=".env.bak.${TIMESTAMP}"
cp .env "$BACKUP"
chmod 600 "$BACKUP"
echo -e "  ${GREEN}✓${RESET} Backed up current .env → ${BACKUP}"

POSTGRES_USER=$(grep '^POSTGRES_USER=' .env | cut -d= -f2)
POSTGRES_DB=$(grep '^POSTGRES_DB='   .env | cut -d= -f2)
ADMIN_EMAIL=$(grep '^ADMIN_EMAIL='   .env | cut -d= -f2)

# ── Generate new values ─────────────────────────────────────────
echo -e "\n${BOLD}Generating new secrets...${RESET}"
NEW_ACCESS_SECRET=$(openssl rand -hex 64)
NEW_REFRESH_SECRET=$(openssl rand -hex 64)
NEW_PG_PASS=$(openssl rand -hex 24)
NEW_REDIS_PASS=$(openssl rand -hex 24)
echo -e "  ${GREEN}✓${RESET} JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, REDIS_PASSWORD, POSTGRES_PASSWORD"

# ── Postgres: change the live DB user's password FIRST ─────────
# .env alone does nothing here — POSTGRES_PASSWORD only applies when
# Postgres initializes a brand-new empty data volume. The real
# password lives in Postgres' own catalog on an already-running DB.
echo -e "\n${BOLD}Rotating Postgres password...${RESET}"
docker exec nodemap_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "ALTER USER ${POSTGRES_USER} WITH PASSWORD '${NEW_PG_PASS}';" >/dev/null
echo -e "  ${GREEN}✓${RESET} Postgres user password changed"

# ── Update .env with new values ─────────────────────────────────
echo -e "\n${BOLD}Updating .env...${RESET}"
sed -i \
  -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${NEW_PG_PASS}|" \
  -e "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=${NEW_REDIS_PASS}|" \
  -e "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=${NEW_ACCESS_SECRET}|" \
  -e "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${NEW_REFRESH_SECRET}|" \
  .env
echo -e "  ${GREEN}✓${RESET} .env updated"

# ── Restart containers that need the new values ─────────────────
# Redis re-reads --requirepass fresh on every start; the backend
# needs both the new Postgres and Redis passwords and re-signs all
# future JWTs with the new secrets (existing tokens stop verifying —
# every session is force-logged-out, which is the point).
echo -e "\n${BOLD}Restarting redis + backend...${RESET}"
docker compose up -d --force-recreate redis backend
echo -e "  ${GREEN}✓${RESET} Containers restarted with new credentials"

# ── Optional: admin password ────────────────────────────────────
if [[ "${1:-}" == "--admin-password" ]]; then
  echo -e "\n${BOLD}Admin password rotation...${RESET}"
  # ON CONFLICT DO NOTHING in seedAdmin() means env vars can't change
  # an existing admin's password — it has to be written to the DB
  # directly, hashed the same way the app hashes it (bcryptjs).
  read -sp "  New admin password for ${ADMIN_EMAIL} (min 12 chars): " NEW_ADMIN_PASS
  echo
  if [ ${#NEW_ADMIN_PASS} -lt 12 ]; then
    NEW_ADMIN_PASS=$(openssl rand -hex 12)
    echo -e "  ${YELLOW}Too short — generated one instead: ${BOLD}${NEW_ADMIN_PASS}${RESET}"
  fi

  docker exec -e NEW_PW="${NEW_ADMIN_PASS}" -e TARGET_EMAIL="${ADMIN_EMAIL}" \
    nodemap_backend node --input-type=module -e "
      import bcrypt from 'bcryptjs';
      import { query } from './src/db/pool.js';
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const hash = await bcrypt.hash(process.env.NEW_PW, rounds);
      const { rowCount } = await query(
        \"UPDATE users SET password_hash=\$1 WHERE email=\$2\",
        [hash, process.env.TARGET_EMAIL]
      );
      if (rowCount === 0) { console.error('No user found for', process.env.TARGET_EMAIL); process.exit(1); }
      console.log('Admin password updated for', process.env.TARGET_EMAIL);
      process.exit(0);
    "
  echo -e "  ${GREEN}✓${RESET} Admin password updated"
fi

echo ""
echo -e "${BOLD}${GREEN}────────────────────────────────────────${RESET}"
echo -e "${BOLD}${GREEN}  ✓ Rotation complete${RESET}"
echo -e "${BOLD}${GREEN}────────────────────────────────────────${RESET}"
echo ""
echo -e "  Previous .env saved as: ${CYAN}${BACKUP}${RESET} — delete it once you've verified everything works."
echo -e "  All existing sessions have been invalidated (JWT secrets rotated)."
if [[ "${1:-}" != "--admin-password" ]]; then
  echo -e "  ${YELLOW}Tip:${RESET} run with --admin-password to also rotate the admin account's password."
fi
echo ""
