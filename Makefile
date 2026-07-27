.PHONY: up down restart logs ps backup restore shell-db shell-backend gen-certs rotate-secrets rotate-secrets-full help

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
update:
	docker compose pull
	docker compose up -d --build --remove-orphans
	docker image prune -f

# ── Health check ─────────────────────────────────────────────
health:
	@curl -sk https://localhost/health | python3 -m json.tool 2>/dev/null || \
	 curl -s  http://localhost/health  | python3 -m json.tool

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
	@echo "  make backup          Backup PostgreSQL to backups/"
	@echo "  make restore FILE=…  Restore from a backup file"
	@echo "  make shell-db        Open psql shell"
	@echo "  make shell-backend   Open backend sh shell"
	@echo "  make shell-redis     Open redis-cli"
	@echo "  make rotate-secrets       Rotate JWT/Redis/Postgres passwords"
	@echo "  make rotate-secrets-full  Also rotate the admin password"
	@echo "  make gen-certs       Generate self-signed TLS cert"
	@echo "  make build           Force rebuild all images"
	@echo "  make update          Pull + rebuild (rolling update)"
	@echo "  make health          Check /health endpoint"
	@echo ""
