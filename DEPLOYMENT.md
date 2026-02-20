# DEPLOYMENT GUIDE — HORECA AI Unified Engine

## Table of Contents

1. [Quick Start (local)](#quick-start-local)
2. [Environment Variables](#environment-variables)
3. [Docker Setup](#docker-setup)
4. [Production Checklist](#production-checklist)
5. [Security Hardening](#security-hardening)
6. [Performance Optimisation](#performance-optimisation)
7. [Database Backup & Restore](#database-backup--restore)
8. [Monitoring](#monitoring)
9. [Scaling](#scaling)
10. [API Documentation](#api-documentation)

---

## Quick Start (local)

```bash
# 1. Clone & install
git clone <repo-url>
cd old-hybrid
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and set JWT_SECRET at minimum

# 3. Start server (port 3001)
npm start
# → http://localhost:3001/api/health
```

---

## Environment Variables

Copy `.env.example` to `.env.local` (development) or set them as real environment variables in production.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `local` | `local` / `development` / `production` |
| `PORT` | No | `3001` | HTTP server port |
| `SQLITE_PATH` | No | `./data/restaurant.db` | SQLite database path |
| `DATABASE_URL` | No | `./data/restaurant.db` | Alias for SQLITE_PATH |
| `LOG_LEVEL` | No | `info` | `error` / `warn` / `info` / `debug` |
| `JWT_SECRET` | **Yes** | — | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | No | `7d` | JWT token lifetime |
| `AI_PROVIDER` | No | `auto` | `auto` / `groq` / `openai` / `ollama` |
| `GROQ_API_KEY` | No | — | Groq AI API key |
| `OPENAI_API_KEY` | No | — | OpenAI API key |
| `CLOUD_ENABLED` | No | `false` | Enable cloud sync / backup |
| `FRONTEND_BUILD` | No | `dist` | Path to built frontend assets |

---

## Docker Setup

### Single container

```bash
# Build
docker build -t horeca-ai .

# Run
docker run -d \
  --name horeca-ai \
  -p 3001:3001 \
  -e JWT_SECRET=your-strong-secret \
  -v $(pwd)/data:/data \
  -v $(pwd)/logs:/app/logs \
  horeca-ai
```

### Docker Compose (recommended)

```bash
# Create .env with secrets
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# Start
docker compose up -d

# Logs
docker compose logs -f

# Stop
docker compose down
```

### Health check

```bash
curl http://localhost:3001/api/health
# {"status":"ok","environment":"production","timestamp":"...","database":"sqlite"}
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate a strong `JWT_SECRET` (`openssl rand -hex 32`)
- [ ] Set `PORT` (default: 3001)
- [ ] Set `SQLITE_PATH` to a persistent volume
- [ ] Configure `LOG_LEVEL=warn` or `error` to reduce log volume
- [ ] Build the frontend: `npm run build`
- [ ] Point `FRONTEND_BUILD` to the `dist/` directory
- [ ] Enable HTTPS via a reverse-proxy (nginx / Caddy)
- [ ] Configure firewall — only expose port 80/443 externally
- [ ] Set up automated database backups (see below)
- [ ] Configure log rotation

---

## Security Hardening

### HTTPS with nginx (recommended)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### JWT secret rotation

Generate a new secret and restart the server:

```bash
JWT_SECRET=$(openssl rand -hex 32)
# Update in your environment / secrets manager, then restart
```

### Rate limiting

The server uses `express-rate-limit`. For production, adjust limits in `backend/middleware/` or behind nginx:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
location /api/ {
    limit_req zone=api burst=10 nodelay;
}
```

---

## Performance Optimisation

- **Compression** is enabled by default (gzip, level 6) for all responses > 1 KB.
- **Static assets** are served with a 1-year `Cache-Control` header.
- **SQLite WAL mode** is enabled for better concurrent read performance.
- **Socket.IO** uses the `/kds` namespace to avoid polluting the default namespace.

---

## Database Backup & Restore

### Manual backup

```bash
# SQLite hot backup (safe while the server is running)
sqlite3 ./data/restaurant.db ".backup '/backups/restaurant-$(date +%Y%m%d-%H%M%S).db'"
```

### Automated daily backup (cron)

```cron
0 2 * * * sqlite3 /app/data/restaurant.db ".backup '/backups/restaurant-$(date +%Y%m%d).db'" && find /backups -name "*.db" -mtime +30 -delete
```

### Restore

```bash
# Stop the server first, then:
cp /backups/restaurant-YYYYMMDD.db ./data/restaurant.db
npm start
```

---

## Monitoring

### Health endpoint

```
GET /api/health
```

Returns:

```json
{
  "status": "ok",
  "environment": "production",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "database": "sqlite",
  "version": "1.0.0"
}
```

### Performance metrics endpoint

```
GET /api/performance
```

### Uptime monitoring (e.g. UptimeRobot)

Point an HTTP monitor at `https://your-domain.com/api/health`. Alert on non-`200` responses.

---

## Scaling

The application uses SQLite which is **single-writer** by design. For multi-instance scaling:

1. **Vertical scaling** — increase CPU/RAM on a single node (recommended for most deployments).
2. **Read replicas** — use SQLite streaming replication (e.g. Litestream) to a read replica.
3. **Migration to PostgreSQL** — if you need true horizontal scaling, migrate to PostgreSQL by updating the database adapters in `backend/database/` and `backend/src/loaders/`.

---

## API Documentation

All API endpoints are prefixed with `/api/`.

| Path | Description |
|---|---|
| `GET /api/health` | Server health check |
| `POST /api/auth/login` | Authenticate a user |
| `GET /api/produse` | List products |
| `GET /api/comenzi` | List orders |
| `GET /api/kds` | KDS items |
| `GET /api/stoc` | Stock levels |
| `GET /api/vouchers` | Vouchers |
| `POST /api/ai/menu/optimize` | AI menu optimisation |
| `POST /api/ai/import` | AI product import from document |
| `GET /api/audit` | Audit log |

A complete Postman collection is available at `postman-collection.json` in the repository root.
