# SAURORAA RECORDS

Production-ready monorepo scaffold for a Dockerized label platform:

- `frontend`: Next.js 14 (App Router, TypeScript, Tailwind)
- `backend`: NestJS + Prisma (MariaDB)
- `cron-service`: monthly artist revenue/facturation worker
- `nginx`: reverse proxy + static cache + gzip + API routing
- `docker-compose.yml`: full local/prod-like orchestration

## Quick Start

1. Copy env files:
   - `cp .env.example .env`
   - `cp frontend/.env.example frontend/.env.local`
   - `cp backend/.env.example backend/.env`
2. Run stack:
   - `docker compose up -d --build`
   - Optional tools: `docker compose --profile tools up -d`
   - Optional S3-compatible storage: `docker compose --profile storage up -d`
3. Open:
   - Frontend: `https://sauroraarecords.be`
   - API health: `https://sauroraarecords.be/api/health`
   - Adminer (optional): `http://localhost:8080`

## Services

- `nginx`: entrypoint on 80/443
- `frontend`: Next.js app on 3000
- `backend`: NestJS API on 4000
- `mariadb`: primary DB
- `redis`: optional cache/session/rate-limit backend
- `adminer`: optional DB UI
- `cron-service`: monthly payout/invoice job
- `minio`: optional S3-compatible object storage

## Backend Modules (base)

- Auth (`/api/auth`)
- Users (`/api/users`)
- Artists (`/api/artists`)
- Releases (`/api/releases`)
- Orders (`/api/orders`)
- Revenue (`/api/revenue`)
- Health (`/api/health`)

## Notes

- This is a strong starter architecture and code skeleton.
- Payment/invoice internals (Stripe checkout, PDF rendering, mail transport) are wired as extension points and can be completed safely per your production credentials.
- First TLS issuance on Debian 12 (host):
  - `sudo apt update && sudo apt install -y certbot`
  - `sudo systemctl stop nginx || true`
  - `sudo docker compose down || true`
  - `sudo certbot certonly --standalone -d sauroraarecords.be -d www.sauroraarecords.be -m admin@sauroraarecords.be --agree-tos --no-eff-email`
  - `sudo mkdir -p /var/www/certbot`
  - `docker compose up -d --build`
