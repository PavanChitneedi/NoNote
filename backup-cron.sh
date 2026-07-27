#!/usr/bin/env bash
# NodeMap — Scheduled backup wrapper
# Usage: bash backup-cron.sh
#
# Runs `make backup`, then prunes backups older than BACKUP_RETENTION_DAYS
# (default 14). Meant to be run from cron, not by hand — see
# `make install-backup-cron` for installing it automatically, or add the
# crontab line it prints yourself.

set -euo pipefail

# Cron's PATH is minimal — make sure docker/make are found regardless of
# where this box installed them.
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

cd "$(dirname "$0")"

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

echo "[$(date -Iseconds)] Starting backup..."
make backup

echo "[$(date -Iseconds)] Pruning backups older than ${RETENTION_DAYS} days..."
find backups -name "nodemap_*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete

echo "[$(date -Iseconds)] Done. Current backups:"
ls -lh backups/*.sql.gz 2>/dev/null || echo "  (none)"
