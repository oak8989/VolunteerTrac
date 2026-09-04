# Volunteertrac — volunteer time tracking, self-hosted

A self-contained Docker application for planning events, running attendance, managing members and waivers, and reporting volunteer impact. The whole product ships as a single container: a Vite/React SPA served by nginx — no external services required.

## Quick start — one command

```bash
git clone https://github.com/oak8989/volunteertrac.git
cd volunteertrac
./up.sh                     # checks Docker, builds, waits, prints the URL
```

Open **http://localhost:8080** and pick a demo identity on the sign-in screen (one admin, several volunteers). That's the entire setup — no database, no secrets, no `.env` required.

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

Optional config lives in `.env.example` (just `PORT` and `TZ` — both have sensible defaults). Data persists in the browser via localStorage; reset it anytime from **Admin → Settings → Demo data**, and browse copy-pasteable deployment recipes in **Admin → Deploy**.

## What's inside

| Area | Capabilities |
| --- | --- |
| **Events** | Public events, private group events (invite by group), weekly/monthly recurring series, capacity tracking, live-event detection |
| **Attendance** | Per-event ledger, one-tap check-in/check-out with live timers, walk-in check-in via QR code, admin time corrections, per-event CSV export |
| **Members** | Profiles, groups, admin assistants (role = admin), participation history per member, activate/pause, full CSV export |
| **Organization** | White-label branding (name, logo upload or preset marks, theme accent), editable liability waiver with e-signature flow, award thresholds, org info |
| **Member portal** | Upcoming events, one-tap registration with simulated confirmation emails, waiver signing, QR walk-in scanner, personal hours ledger, membership QR card, password reset |
| **Impact** | Org-wide hours and estimated dollar value, monthly trend chart, medal distribution, volunteer leaderboard with progress to next medal, per-event breakdown |

Medals (Seedling → Trailblazer → Beacon → Lighthouse) unlock automatically as hours accrue; thresholds are configurable in **Settings → Award thresholds**.

## Architecture

```
┌─────────────────────────────────┐
│  nginx:1.27-alpine  (port 80)   │
│  ├─ serves dist/ (SPA + assets) │
│  └─ SPA fallback for routes     │
└─────────────────────────────────┘
          ▲ built by
┌─────────────────────────────────┐
│  node:20-alpine (build stage)   │
│  └─ vite build                  │
└─────────────────────────────────┘
```

- **Multi-stage Dockerfile** — dependencies and build artifacts never ship in the runtime image (~50 MB final).
- **Healthcheck** baked into both the image and `docker-compose.yml`.
- **State** — this demo persists to `localStorage`, so a single container is fully self-contained. Swap `src/lib/store.tsx` for a REST/Postgres backend without touching the views.

## Publish to GitHub (oak8989)

```bash
# 1. Create the repo on GitHub (either)
gh repo create volunteertrac --public --source=. --remote=origin --push
# …or create an empty repo at https://github.com/new, then:
./publish.sh
```

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
