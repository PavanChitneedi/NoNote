.PHONY: up down restart logs ps backup restore install-backup-cron shell-db shell-backend gen-certs rotate-secrets rotate-secrets-full build pull update rollback deploy health _healthcheck help

GIT_SHA := $(shell git rev-parse --short HEAD 2>/dev/null || echo unknown)

# ── Startup ───────────────────────────────────────────────────
up:
	docker compose up -d
	@echo "NodeMap started. Open https://localhost"

down:
	docker compose down

restart:
	docker compose restart

# ── Logs ──────────────────────────────────────────────────────
logs:
	docker compose logs -f --tail=100

logs-backend:
	docker compose logs -f backend --tail=100

logs-nginx:
	docker compose logs -f nginx --tail=50

# ── Status ────────────────────────────────────────────────────
ps:
	docker compose ps

# ── Backup ───────────────────────────────────────────────────
backup:
	@mkdir -p backups
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	docker exec nodemap_postgres pg_dump \
	  -U $${POSTGRES_USER:-nodemap} $${POSTGRES_DB:-nodemap} \
	  | gzip > backups/nodemap_$$TIMESTAMP.sql.gz; \
	echo "Backup saved: backups/nodemap_$$TIMESTAMP.sql.gz"

restore:
	@test -n "$(FILE)" || (echo "Usage: make restore FILE=backups/nodemap_XXXXX.sql.gz" && exit 1)
	@echo "Restoring from $(FILE)..."
	gunzip -c $(FILE) | docker exec -i nodemap_postgres psql \
	  -U $${POSTGRES_USER:-nodemap} $${POSTGRES_DB:-nodemap}
	@echo "Restore complete."

install-backup-cron:
	@CRON_LINE="0 3 * * * cd $$(pwd) && ./backup-cron.sh >> backups/backup.log 2>&1"; \
	mkdir -p backups; \
	( crontab -l 2>/dev/null | grep -vF "backup-cron.sh" ; echo "$$CRON_LINE" ) | crontab -; \
	echo "Installed — daily backup at 3am, keeping 14 days (set BACKUP_RETENTION_DAYS to change)."; \
	echo "Verify with: crontab -l"

# ── Shell access ─────────────────────────────────────────────
shell-db:
	docker exec -it nodemap_postgres psql -U $${POSTGRES_USER:-nodemap} $${POSTGRES_DB:-nodemap}

shell-backend:
	docker exec -it nodemap_backend sh

shell-redis:
	docker exec -it nodemap_redis redis-cli --pass $${REDIS_PASSWORD}

# ── Secrets ──────────────────────────────────────────────────
rotate-secrets:
	@bash rotate-secrets.sh

rotate-secrets-full:
	@bash rotate-secrets.sh --admin-password

# ── TLS ──────────────────────────────────────────────────────
gen-certs:
	@mkdir -p nginx/certs
	openssl req -x509 -newkey rsa:4096 \
	  -keyout nginx/certs/key.pem \
	  -out nginx/certs/cert.pem \
	  -days 3650 -nodes \
	  -subj "/CN=nodemap.local"
	@echo "Self-signed cert generated in nginx/certs/"

# ── Build ────────────────────────────────────────────────────
build:
	docker compose build --no-cache

pull:
	docker compose pull

# ── Update (zero-downtime rolling) ───────────────────────────
# Tags the built images with the current git commit (GIT_SHA) so a bad
# deploy can be rolled back to the exact previous image without a rebuild
# — see `make rollback`. Verifies the app actually comes back healthy
# afterward instead of silently leaving a broken deploy running.
update:
	docker compose pull
	GIT_SHA=$(GIT_SHA) docker compose build backend frontend
	@docker tag nonote-backend:$(GIT_SHA) nonote-backend:latest
	@docker tag nonote-frontend:$(GIT_SHA) nonote-frontend:latest
	GIT_SHA=$(GIT_SHA) docker compose up -d --remove-orphans
	docker image prune -f
	@echo "Deployed commit $(GIT_SHA) — checking health..."
	@$(MAKE) --no-print-directory _healthcheck || \
	  (echo "FAILED health check after update. Roll back with: make rollback SHA=<previous-sha>  (see: docker images | grep nonote-backend)" && exit 1)
	@echo "Update successful — running commit $(GIT_SHA)"

# ── Rollback ──────────────────────────────────────────────────
# Runs a PREVIOUSLY-BUILT image tag without rebuilding — only works if that
# tag hasn't been pruned. List what's available with:
#   docker images | grep nonote-backend
# Only works for commits deployed via `make update` after this feature was
# added; there's no tagged image for anything deployed before that.
rollback:
	@test -n "$(SHA)" || (echo "Usage: make rollback SHA=<short-git-sha>  (see: docker images | grep nonote-backend)" && exit 1)
	@echo "Rolling back to $(SHA) (no rebuild — using the already-built image)..."
	GIT_SHA=$(SHA) docker compose up -d --no-deps backend frontend
	@$(MAKE) --no-print-directory _healthcheck || \
	  (echo "FAILED health check after rollback to $(SHA)." && exit 1)
	@echo "Rolled back to $(SHA)"

# ── Deploy: pull latest code, then update ────────────────────
deploy:
	git pull
	@$(MAKE) --no-print-directory update

# ── Health check ─────────────────────────────────────────────
health:
	@curl -sk https://localhost/health | python3 -m json.tool 2>/dev/null || \
	 curl -s  http://localhost/health  | python3 -m json.tool

# Internal: polling health check with a real pass/fail exit code, used by
# update/rollback. (`make health` above is for humans reading output and
# doesn't reliably exit non-zero on failure — this does.)
_healthcheck:
	@for i in 1 2 3 4 5 6; do \
	  if curl -sfk https://localhost/health >/dev/null 2>&1 || curl -sf http://localhost/health >/dev/null 2>&1; then \
	    exit 0; \
	  fi; \
	  echo "  waiting for app to respond... ($$i/6)"; sleep 3; \
	done; \
	exit 1

help:
	@echo ""
	@echo "  NodeMap — Makefile commands"
	@echo ""
	@echo "  make up              Start all services"
	@echo "  make down            Stop all services"
	@echo "  make restart         Restart all services"
	@echo "  make logs            Tail all logs"
	@echo "  make logs-backend    Tail backend logs only"
	@echo "  make ps              Show service status"
	@echo "  make backup               Backup PostgreSQL to backups/"
	@echo "  make restore FILE=…       Restore from a backup file"
	@echo "  make install-backup-cron  Schedule daily backups via cron (3am, 14-day retention)"
	@echo "  make shell-db        Open psql shell"
	@echo "  make shell-backend   Open backend sh shell"
	@echo "  make shell-redis     Open redis-cli"
	@echo "  make rotate-secrets       Rotate JWT/Redis/Postgres passwords"
	@echo "  make rotate-secrets-full  Also rotate the admin password"
	@echo "  make gen-certs       Generate self-signed TLS cert"
	@echo "  make build                Force rebuild all images"
	@echo "  make update               Rebuild + rolling update, tagged by git commit, health-checked"
	@echo "  make rollback SHA=…       Roll back to a previously-deployed commit (no rebuild)"
	@echo "  make deploy               git pull + make update, in one step"
	@echo "  make health               Check /health endpoint"
	@echo ""
