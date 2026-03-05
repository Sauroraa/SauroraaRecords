# SAURORAA ECOSYSTEM

Plateforme multi-service pour:

- `sauroraarecords.be` (Records Web: business, upload, monétisation)
- `music.sauroraarecords.be` (Music Web: streaming/découverte)

Stack:

- Front: Next.js (Records) + client Music séparé
- API: NestJS + Prisma
- Data: MariaDB + Redis + Meilisearch
- Storage: MinIO/S3
- Infra: Docker + Nginx (gateway + host reverse proxy)
- Worker: ffmpeg (HLS full/preview + waveform)

## Architecture

`Internet -> Host Nginx (80/443) -> Docker Nginx gateway (127.0.0.1:3100) -> records-web | music-web | api`

Services Docker prod:

- `nginx`
- `records-web`
- `music-web`
- `api`
- `worker`
- `cron`
- `mariadb`
- `redis`
- `meilisearch`
- `minio`

## Streaming sécurisé anti-leak

- Endpoint API `GET /api/stream/token/:releaseId`:
  - vérifie entitlement (achat)
  - fallback preview si non acheté
  - génère token HMAC court (30s)
- Nginx protège `/hls/...` via `auth_request` vers `GET /api/stream/verify`
- IP binding + expiration + scope (`preview|full`)
- Segments HLS courts

## Nouveaux modules backend

- `stream`: tokenisation et vérification stream
- `search`: recherche Meilisearch avec fallback SQL
- `ledger`: écritures comptables et résumés artiste
- `premium`: private listening links, collab releases, repost feed, fan ranking, campagnes promo, early access, AI tagging jobs, watermark fingerprint
- `ecosystem`: DMCA claims, reports + moderation queue, duplicate audio scan, AI text moderation, share cards, premieres/chat, artist broadcasts, payouts, accounting exports, heatmap, asset packs, embed player, track versioning, 2FA/recovery/login alerts, public API clients, push devices, admin global analytics

Le schéma Prisma inclut désormais:

- `ReleaseFile`
- `StreamEvent`
- `Invoice`
- `LedgerEntry`
- `Playlist` / `PlaylistTrack`
- `ReleaseCollaborator`
- `PrivateListeningLink`
- `Repost`
- `FanScore`
- `PromotionCampaign`
- `AiTaggingJob`
- `LeakFingerprint`
- `DmcaClaim`
- `ContentReport` / `AiModerationFlag` / `ModerationAction`
- `DuplicateAudioAlert`
- `ArtistTrustScore`
- `ReleaseSchedule`
- `ViralShareCard`
- `FanBadge` / `UserFanBadge`
- `PremiereEvent` / `PremiereChatMessage`
- `ArtistBroadcast` / `ArtistBroadcastRecipient`
- `PayoutAccount` / `PayoutTransaction`
- `AccountingExport`
- `SmartTagSuggestion`
- `ListeningHeatmap`
- `ReleaseAssetPack`
- `EmbedWidget`
- `TrackVersion`
- `SecurityRecoveryToken` / `UserTwoFactor` / `LoginAlert`
- `PublicApiClient`
- `PushDevice`
- champs HLS/preview sur `Release`

## Lancement local

1. Préparer env:
   - copier `.env.example` vers `.env`
   - copier `backend/.env.example` vers `backend/.env`
2. Démarrer:
   - `docker compose -f docker-compose.prod.yml up -d --build`
3. Vérifier:
   - `http://127.0.0.1:3100/api/health`

## Déploiement Debian 12

1. Conserver Nginx host comme reverse proxy public.
2. Utiliser le projet sur loopback `127.0.0.1:3100`.
3. Installer la conf host:
   - copier `nginx/host-site.sauroraa-ecosystem.conf` dans `/etc/nginx/sites-available/`
   - créer le symlink dans `/etc/nginx/sites-enabled/`
   - `nginx -t && systemctl reload nginx`

## Migration DB

Migration ajoutée:

- `backend/prisma/migrations/20260305120000_stream_ledger_search/migration.sql`

Appliquer:

- `cd backend && npx prisma migrate deploy`
