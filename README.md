# CRRT - Club Robotique & Recherche Technologique

> **ENSA Agadir** | Since 2008 | "Our robots never sleep."

A full-stack platform for CRRT (Club Robotique & Recherche Technologique) at ENSA Agadir, built with the **"Mature Glass Lab"** design language.

---

## Quick Start

Prerequisites:
- Node.js 20+
- PostgreSQL running locally (or reachable from `DATABASE_URL`)
- Docker (optional, for fully containerized dev with hot reload)

```bash
# 1. Install dependencies
npm install

# 2. Create local environment file
cp .env.example .env

# 3. Apply migrations
npm run db:migrate

# 4. Seed with realistic data
npm run db:seed

# 5. Start the dev server
npm run dev
```

If you use PowerShell, step 2 is:

```powershell
Copy-Item .env.example .env
```

Open [http://localhost:3000](http://localhost:3000) for the public site and [http://localhost:3000/login](http://localhost:3000/login) for sign-in (members, editors, and admins).

Seeded credentials:
- `admin@crrt.ma / crrt2026`
- `editor@crrt.ma / crrt2026`
- `member@crrt.ma / crrt2026`

### Docker Dev Stack (Hot Reload)

If you want Postgres + app fully inside Docker for development:

```bash
# Start postgres + app in Docker Compose watch mode
npm run dev:docker
```

In another terminal, seed once after first boot:

```bash
npm run dev:docker:seed
```

Useful helpers:

```bash
npm run dev:docker:up    # Start Docker dev stack without Compose watch
npm run dev:docker:logs  # Follow app + postgres logs
npm run dev:docker:down  # Stop dev stack
npm run dev:docker:reset # Reset database + reseed
```

Notes:
- App URL remains `http://localhost:3000`.
- The dev stack uses an internal Docker DB URL (`postgres:5432`) and does not require local Postgres on your host.
- `npm run dev:docker` uses Docker Compose watch mode, so dependency/config changes can rebuild or restart automatically.
- Docker dev reads `NEXTAUTH_SECRET` from your project `.env`, so keep it stable across `npm run dev` and `npm run dev:docker`.
- If you rotate `NEXTAUTH_SECRET`, clear your `localhost` cookies or sign out/in to avoid one-time `next-auth` `JWEDecryptionFailed` session warnings.

---

### Re-seeding

```bash
# Reset and re-seed
npm run db:reset
```
---

## Deployment Runbook (Single VPS: Docker + Nginx)

This project supports **PostgreSQL only** in both dev and production.

### 1) VPS hardening prerequisites (Ubuntu 22.04+)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg lsb-release ufw fail2ban nginx certbot python3-certbot-nginx

# Basic firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

Install Docker Engine + Compose plugin:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
newgrp docker
docker --version
docker compose version
```

### 2) Clone and prepare runtime directories

```bash
sudo mkdir -p /opt/crrt
sudo chown -R "$USER":"$USER" /opt/crrt
cd /opt/crrt
git clone <YOUR_REPO_URL> .

mkdir -p data/uploads backups
cp .env.production.example .env.production
```

Required `.env.production` values:

```dotenv
POSTGRES_DB=crrt
POSTGRES_USER=crrt
POSTGRES_PASSWORD=CHANGE_ME
DATABASE_URL=postgresql://crrt:CHANGE_ME@postgres:5432/crrt?schema=public
NEXTAUTH_SECRET=LONG_RANDOM_SECRET
NEXTAUTH_URL=https://your-domain.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASS=CHANGE_ME
SMTP_FROM=CRRT <alerts@your-domain.com>
ADMIN_EMAIL=admin@your-domain.com
MEDIA_UPLOAD_DIR_HOST=./data/uploads
```

### 3) First boot (deterministic reset/reseed path)

```bash
# Build and start postgres + migration + app
docker compose --env-file .env.production --profile production up -d --build

# Optional deterministic reset + reseed (recommended for first production cutover)
docker compose --env-file .env.production --profile production run --rm app npx prisma migrate reset --force --skip-generate --skip-seed
docker compose --env-file .env.production --profile production --profile seed run --rm seed

# Bring app back up after reset
docker compose --env-file .env.production --profile production up -d app
```

Seeded credentials after reset/reseed:
- `admin@crrt.ma / crrt2026`
- `editor@crrt.ma / crrt2026`
- `member@crrt.ma / crrt2026`

Admin UI shows a warning banner until the seeded admin password is rotated.

### 4) Health and first-login verification

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/api/metrics
```

Then verify in browser:
- `https://your-domain.com/`
- `https://your-domain.com/login`
- Sign in as admin and rotate password at `/admin/settings`.


### 5) Persistent volumes

- PostgreSQL data: Docker named volume `postgres-data`.
- Uploads persistence: bind mount from `MEDIA_UPLOAD_DIR_HOST` to `/app/public/uploads`.
- Keep `MEDIA_UPLOAD_DIR_HOST` outside container lifecycle (already set to `./data/uploads` by default).

### 6) Backup and restore

Backup:

```bash
set -a; source .env.production; set +a
mkdir -p backups
docker compose --env-file .env.production exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "backups/db-$(date +%F-%H%M).sql.gz"
tar -czf "backups/uploads-$(date +%F-%H%M).tar.gz" data/uploads
```

Restore:

```bash
set -a; source .env.production; set +a
gunzip -c backups/db-YYYY-MM-DD-HHMM.sql.gz | docker compose --env-file .env.production exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
tar -xzf backups/uploads-YYYY-MM-DD-HHMM.tar.gz
```

### 7) Update and rollback

Update:

```bash
cd /opt/crrt
git fetch --all --tags
git checkout <release-tag-or-commit>
docker compose --env-file .env.production --profile production up -d --build
```

Rollback:

```bash
cd /opt/crrt
git checkout <previous-release-tag-or-commit>
docker compose --env-file .env.production --profile production up -d --build
```

If rollback requires data rollback, restore both DB dump and uploads tarball from the same backup timestamp.

### 8) Post-deploy smoke checklist

```bash
curl -fsS https://your-domain.com/api/health
curl -fsS https://your-domain.com/api/metrics
```

Manual checks:
- Admin routes reject anonymous users (`/admin` redirects to `/login?callbackUrl=/admin`).
- Member can register for an event and sees it in `/dashboard`.
- Private resources show in member dashboard and are blocked when anonymous.

### 9) Routine deploy + incident response checklist

Routine deploy:
1. Create DB + uploads backups.
2. Pull release tag/commit.
3. `docker compose ... up -d --build`.
4. Run smoke checks.
5. Review logs for 5-10 minutes.

Incident response:
1. Confirm blast radius (`/api/health`, `/api/metrics`, user-facing pages).
2. Capture logs: `docker compose --env-file .env.production logs --since=30m app postgres`.
3. If release regression, rollback to previous tag.
4. If data issue, restore DB + uploads from matching backup snapshot.
5. Re-run smoke checklist and keep incident notes.

---
## CI and Test Commands

GitHub Actions (`.github/workflows/ci.yml`) runs:
- Lint + build (includes type checks) + Vitest unit/API tests.
- Playwright smoke E2E against seeded PostgreSQL service.

Local test commands:

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
```

---
## Scripts

```bash
npm run dev         # Start dev server
npm run dev:docker  # Start Docker dev stack with Compose watch (auto rebuild/restart)
npm run dev:docker:up # Start Docker dev stack without Compose watch
npm run dev:docker:logs # Follow Docker dev logs
npm run dev:docker:seed # Seed Docker dev database
npm run dev:docker:reset # Reset + migrate + seed Docker dev database
npm run dev:docker:down # Stop Docker dev stack
npm run build       # Production build (webpack mode)
npm run start       # Start production server
npm run test        # Vitest unit/API tests
npm run test:e2e    # Playwright smoke E2E
npm run db:migrate  # Create/apply local migrations in development
npm run db:deploy   # Apply migrations in production
npm run db:seed     # Run seed script
npm run db:reset    # Reset + migrate + seed
npm run db:studio   # Open Prisma Studio
```

---

## License

Built for CRRT - Club Robotique & Recherche Technologique, ENSA Agadir.
