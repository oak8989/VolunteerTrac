# Volunteertrac — volunteer time tracking, self-hosted

A self-contained Docker application for planning events, running attendance, managing members and waivers, and reporting volunteer impact. The whole product ships as a single container: a Vite/React SPA served by nginx — no external services required.

## Quick start — one command

```bash
git clone https://github.com/oak8989/volunteertrac.git
cd volunteertrac
./up.sh                     # checks Docker, builds, waits, prints the URL
```

Open **http://localhost:8080** and sign in with the admin credentials from `docker-compose.yml` (`admin@volunteertrac.local` / `changeme` by default — they're prefilled on first run). That's the entire setup — no database, no secrets, no `.env` required.

Prefer explicit commands?

```bash
docker compose up -d --build          # same thing, manually
PORT=9000 docker compose up -d        # different host port
docker run -d -p 8080:80 ghcr.io/oak8989/volunteertrac   # or just run the CI-built image
```

Or with Make:

```bash
make up        # build & start on :8080  (PORT=9000 make up to change)
make dev       # local dev server, no Docker  (http://localhost:5173)
make logs      # follow nginx logs
make down      # stop & remove
```

Optional config lives in `.env.example`. Everything has a working default; the interesting knobs:

| Variable | What it does |
| --- | --- |
| `PORT` / `TZ` | Host port and container timezone |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | The admin user provisioned at first boot — used to sign in, prefilled on the landing page |
| `ORG_NAME` | White-labels the organization name across the app |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Email server; leave `SMTP_HOST` empty to queue mail in the outbox |

Provisioning happens at container boot (`docker/entrypoint.sh` renders `ADMIN_*` / `SMTP_*` into the SPA's runtime config), so the same image serves any org. Data persists in the browser and round-trips through validated JSON backups (**Admin → Deploy → Persistent storage**); copy-pasteable deployment recipes live in **Admin → Deploy**.

## What's inside

| Area | Capabilities |
| --- | --- |
| **Events** | Public events, private group events (invite by group), weekly/monthly recurring series, capacity tracking, live-event detection |
| **Attendance** | Per-event ledger, one-tap check-in/check-out with live timers, walk-in check-in via QR code, admin time corrections, per-event CSV export |
| **Members** | Profiles, groups, admin assistants (role = admin), participation history per member, activate/pause, full CSV export |
| **Organization** | White-label branding (name, logo upload or preset marks, theme accent), editable liability waiver with e-signature flow, award thresholds, org info |
| **Member portal** | Upcoming events, one-tap registration with confirmation emails, waiver signing, QR walk-in scanner, personal hours ledger, membership QR card, password reset |
| **Email** | Real SMTP delivery via the `mailer` sidecar (Settings → Email server): host/port/user/pass/from, live relay-health indicator, test send, and an outbox that tracks queued / delivered / failed with retry |
| **Impact** | Org-wide hours and estimated dollar value, monthly trend chart, medal distribution, volunteer leaderboard with progress to next medal, per-event breakdown |
| **Payments** | Per-person event fees, simulated card checkout with emailed receipts, admin "mark paid", automatic refunds on cancellation, revenue reporting and CSV columns |
| **Public site** | White-labeled landing page with a live front-desk board, public event calendar with registration, and the sign-in / create-account / password-reset screen |

Medals (Seedling → Trailblazer → Beacon → Lighthouse) unlock automatically as hours accrue; thresholds are configurable in **Settings → Award thresholds**.

## Architecture

```
┌───────────────────────────────────────────────┐
│  nginx:1.27-alpine  (port 80, only exposed)   │
│  ├─ serves dist/ (SPA + assets)               │
│  ├─ /api/mail/*  ──► mailer:8025  (internal)  │
│  └─ SPA fallback for routes                   │
└───────────────────────────────────────────────┘
          ▲ built by            │ sends via
┌─────────────────────┐  ┌───────────────────────┐
│ node:20 (build)     │  │ mailer: node:20        │
│ └─ vite build       │  │ └─ nodemailer → SMTP   │
└─────────────────────┘  └───────────────────────┘
                         ┌───────────────────────┐
                         │ redis:7  (cache tier)  │
                         └───────────────────────┘
```

- **Multi-stage Dockerfile** — dependencies and build artifacts never ship in the runtime image (~50 MB final).
- **Healthcheck** baked into the image and every compose service.
- **Email that actually sends** — the SPA posts to `/api/mail/*`, which nginx proxies to the internal `mailer` sidecar (`mail/server.js`, nodemailer). It honours `SMTP_*` env vars *and* per-request overrides from **Settings → Email server**, so credentials work whether set in compose or in the UI. Messages are queued instantly in the outbox, then settle to *delivered* or *failed* based on the real SMTP result; failed/queued rows have a Retry button. If no host is configured or the relay is down, everything stays queued and nothing is lost.
- **State** — the ledger persists to `localStorage` and round-trips through JSON backups, so the stack is fully self-contained. Swap `src/lib/store.tsx` for a REST/Postgres backend without touching the views.

## Publish to GitHub (oak8989)

```bash
# 1. Create the repo on GitHub (either)
gh repo create volunteertrac --public --source=. --remote=origin --push
# …or create an empty repo at https://github.com/new, then:
./publish.sh              # publish main
./publish.sh feat/setup   # publish a NEW branch and print the PR link
```

Or via Make: `BRANCH=feat/setup make branch` pushes the branch and prints
`https://github.com/oak8989/volunteertrac/compare/main...feat/setup?expand=1`
so you can open the pull request in one click.

The repo lands at **https://github.com/oak8989/volunteertrac** and the included
workflow (`.github/workflows/docker-publish.yml`) automatically builds and pushes
the image to **ghcr.io/oak8989/volunteertrac:latest** on every push to `main`
(and version tags). Pull it anywhere with:

```bash
docker pull ghcr.io/oak8989/volunteertrac:latest
docker run -p 8080:80 ghcr.io/oak8989/volunteertrac:latest
```

## Operations

```bash
docker compose logs -f           # follow nginx logs
docker compose build --no-cache  # force a clean rebuild
./publish.sh                     # push this repo to github.com/oak8989/volunteertrac
```

If a script refuses to run, `chmod +x up.sh publish.sh` (or `make setup`) fixes it.
