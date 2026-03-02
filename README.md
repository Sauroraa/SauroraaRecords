# SAURORAA RECORDS

Production-ready platform for `sauroraarecords.be`:

- Immersive frontend: Next.js 14 + TypeScript + Tailwind + Framer Motion + React Three Fiber + Zustand + React Query + Recharts + Stripe JS
- API backend: NestJS + Prisma + MariaDB + JWT access/refresh tokens
- Billing worker: monthly cron service with PDF invoice generation
- Dockerized services: `nginx`, `frontend`, `backend`, `mariadb`, `redis`, `cron-service`, optional `adminer` and `minio`

## Core Architecture

- Client -> Nginx host (`sites-enabled`) -> container Nginx (`127.0.0.1:3100`) -> Next frontend + Nest API
- Nest API -> MariaDB + Redis + storage (local/S3)
- Cron service runs monthly payout calculations and invoice artifacts

## Services

- `nginx`: internal reverse proxy exposed on `127.0.0.1:3100`
- `frontend`: Next.js runtime on 3000
- `backend`: NestJS runtime on 4000
- `mariadb`: primary SQL datastore
- `redis`: cache and future queue/rate-limit support
- `cron-service`: monthly invoice/revenue worker
- `adminer`: optional database panel (`--profile tools`)
- `minio`: optional S3-compatible storage (`--profile storage`)

## Feature Set

- Auth:
  - Register/login
  - Access token + refresh token rotation
  - Logout token invalidation
- Artist area:
  - Release management skeleton
  - Sales/revenue analytics views
- Admin area:
  - User/release/revenue operation views
  - Commission and invoice actions
- Commerce:
  - Stripe JS checkout integration point
  - Revenue split logic (90/10) supported in data model + cron
 - Subscriptions & billing:
   - Monthly plans for artists, agencies, staff
   - Stripe webhook handling and customer metadata
   - Subscription management endpoints (checkout, cancel, status)
 - Agency support:
   - Agency accounts can add/remove managed artists
   - Staff role reserved for moderation (placeholder UI)
   - Commission rates adapt per plan

## Local Build

1. Copy env files:
   - `cp .env.example .env`
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env.local`
2. Build and run:
   - `docker compose up -d --build`
3. Health:
   - `curl http://127.0.0.1:3100/api/health`

## Debian 12 Production (multi-site safe)

1. Keep host Nginx on public `80/443` for all domains.
2. Use this project only on loopback (`127.0.0.1:3100`).
3. Enable site config:
   - copy `nginx/host-site.sauroraarecords.be.conf` to `/etc/nginx/sites-available/`
   - symlink into `/etc/nginx/sites-enabled/`
   - `nginx -t && systemctl reload nginx`

## Security Baseline

- Helmet headers enabled in Nest
- Global DTO validation enabled
- Global throttling enabled (`@nestjs/throttler`)
- JWT role guard for protected endpoints
- TLS termination through host Nginx + Let’s Encrypt certificates
