# ⬡ NodeMap — Self-Hosted Architecture Diagramming

A production-grade, self-hosted mind mapping and architecture diagramming tool.  
Run it in your homelab and access it from any device including mobile.

---

## Architecture

```
Internet / LAN
      │
   [Nginx]  ← TLS termination, rate limiting, reverse proxy
    ├── /api/* → [Backend]  (Node.js + Express)
    │               ├── PostgreSQL  (persistent data)
    │               └── Redis       (sessions, token blocklist, cache)
    └──  /*   → [Frontend] (React SPA, Nginx static)
```

### RBAC Roles

| Role    | Create Maps | Edit Maps | Invite Users | Manage Users | Admin Panel |
|---------|:-----------:|:---------:|:------------:|:------------:|:-----------:|
| Owner   | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin   | ✓ | ✓ | ✓ | ✓ | ✓ |
| Editor  | ✓ | ✓ | — | — | — |
| Viewer  | — | — | — | — | — |

Per-map permissions can override global role (e.g. a Viewer can be granted Editor on a specific map).

---

## Quick Start

### 1. Clone and configure

```bash
git clone <your-repo-url> nodemap
cd nodemap
cp .env.example .env
```

Edit `.env`:

```bash
# Generate strong secrets
openssl rand -hex 64   # use for JWT_ACCESS_SECRET
openssl rand -hex 64   # use for JWT_REFRESH_SECRET

# Set your passwords
POSTGRES_PASSWORD=your_strong_db_password
REDIS_PASSWORD=your_strong_redis_password
JWT_ACCESS_SECRET=<generated above>
JWT_REFRESH_SECRET=<generated above>

# Your admin account (created on first boot)
ADMIN_EMAIL=admin@yourdomain.local
ADMIN_PASSWORD=your_admin_password

# Your domain or homelab IP
CORS_ORIGIN=https://nodemap.yourdomain.local
```

### 2. Generate TLS certificates

**For homelab (self-signed):**
```bash
mkdir -p nginx/certs
openssl req -x509 -newkey rsa:4096 -keyout nginx/certs/key.pem \
  -out nginx/certs/cert.pem -days 3650 -nodes \
  -subj "/CN=nodemap.local"
```

**For real domain (Let's Encrypt via certbot):**
```bash
mkdir -p nginx/certs
certbot certonly --standalone -d nodemap.yourdomain.com
cp /etc/letsencrypt/live/nodemap.yourdomain.com/fullchain.pem nginx/certs/cert.pem
cp /etc/letsencrypt/live/nodemap.yourdomain.com/privkey.pem   nginx/certs/key.pem
```

### 3. Start

```bash
docker compose up -d
```

**First boot:** The backend automatically creates the owner admin account using  
`ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

Access at: `https://<your-ip>` or `https://nodemap.yourdomain.local`

---

## User Management

Only admins/owners can create users (registration is closed by default).

To add a user: log in → ⚙ ADMIN → ADD USER.

To open self-registration: set `REGISTRATION_OPEN=true` in `.env` and restart.

---

## Data & Backups

All data lives in Docker named volumes.

**Backup PostgreSQL:**
```bash
docker exec nodemap_postgres pg_dump -U nodemap nodemap | gzip > nodemap_$(date +%Y%m%d).sql.gz
```

**Restore:**
```bash
gunzip -c nodemap_20240101.sql.gz | docker exec -i nodemap_postgres psql -U nodemap nodemap
```

**Backup Redis (optional, only caches sessions):**
```bash
docker exec nodemap_redis redis-cli --pass $REDIS_PASSWORD SAVE
docker cp nodemap_redis:/data/dump.rdb ./redis_backup.rdb
```

---

## Scaling

### Horizontal backend scaling

```yaml
# docker-compose.override.yml
services:
  backend:
    deploy:
      replicas: 3
```

Update nginx upstream:
```nginx
upstream backend {
  least_conn;
  server backend:3001;
  # Docker Swarm / Compose scale handles load balancing
}
```

### PostgreSQL connection pooling (PgBouncer)

Add to docker-compose for high traffic:
```yaml
pgbouncer:
  image: pgbouncer/pgbouncer:latest
  environment:
    DATABASES_HOST: postgres
    DATABASES_PORT: 5432
    DATABASES_USER: nodemap
    DATABASES_PASSWORD: ${POSTGRES_PASSWORD}
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 200
    DEFAULT_POOL_SIZE: 20
  networks: [internal]
```

---

## Security Notes

- **Secrets**: never commit `.env` to version control
- **Passwords**: min 8 chars enforced, bcrypt with 12 rounds
- **Tokens**: short-lived access tokens (15m), rotating refresh tokens (7d)
- **Logout**: access tokens are blocklisted in Redis until expiry
- **Rate limiting**: 30 req/min global, 5 req/min on auth endpoints
- **Headers**: HSTS, X-Frame-Options, CSP, nosniff via Helmet + Nginx
- **Network**: backend and DB are on an internal Docker network, not exposed to host

---

## Development

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Postgres + Redis only (for local dev)
docker compose up postgres redis -d
```

Set `VITE_API_BASE_URL=http://localhost:3001/api` in `frontend/.env.local`.

---

## File Structure

```
nodemap/
├── docker-compose.yml
├── .env.example
├── nginx/
│   ├── nginx.conf          # Reverse proxy, TLS, rate limiting
│   └── certs/              # TLS certificates (gitignored)
├── postgres/
│   └── init.sql            # Schema (runs once on first boot)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js         # Express server, security middleware
│       ├── db/
│       │   ├── pool.js      # PostgreSQL connection pool
│       │   └── redis.js     # Redis client
│       ├── middleware/
│       │   └── auth.js      # JWT verification + RBAC
│       └── routes/
│           ├── auth.js      # Login, register, refresh, logout
│           ├── maps.js      # Map CRUD, nodes, edges, collaborators
│           └── users.js     # User management, audit log
└── frontend/
    ├── Dockerfile
    ├── nginx-spa.conf
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── api/client.js    # API client with auto token refresh
        ├── context/
        │   └── AuthContext.jsx
        └── components/
            ├── LoginPage.jsx
            ├── Dashboard.jsx
            ├── NodeCanvas.jsx
            └── AdminPanel.jsx
```
