#!/usr/bin/env bash
# Volunteertrac — one-command bootstrap
# Usage: ./up.sh        (optionally PORT=9000 ./up.sh)
set -euo pipefail

C_OK='\033[1;32m'
C_ACC='\033[1;33m'
C_DIM='\033[2m'
C_ERR='\033[1;31m'
C_RESET='\033[0m'

say() { printf "${C_DIM}▸${C_RESET} %s\n" "$1"; }
ok()  { printf "${C_OK}✓${C_RESET} %s\n" "$1"; }
err() { printf "${C_ERR}✗${C_RESET} %s\n" "$1" >&2; }

cd "$(dirname "$0")"

# 1 — is docker there?
if ! command -v docker >/dev/null 2>&1; then
  err "Docker not found."
  say "Install it from https://docker.com (macOS: 'brew install --cask docker'), then re-run ./up.sh"
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  err "Docker daemon is not running — start Docker Desktop (or dockerd) and re-run ./up.sh"
  exit 1
fi
ok "Docker is running"

# 2 — compose v2 plugin or legacy binary?
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  err "Docker Compose not found — install the compose plugin and re-run."
  exit 1
fi
ok "Using ${COMPOSE}"

# 3 — build & start
say "Building the Volunteertrac image (first run takes ~1–2 minutes)…"
$COMPOSE up -d --build
ok "Container started"

# 4 — wait until it answers
PORT="${PORT:-8080}"
URL="http://localhost:${PORT}"
if command -v curl >/dev/null 2>&1; then
  say "Waiting for ${URL} …"
  for _ in $(seq 1 30); do
    if curl -fsS "${URL}/" >/dev/null 2>&1; then
      echo ""
      ok "Volunteertrac is live → ${C_ACC}${URL}${C_RESET}"
      echo ""
      say "Pick any demo identity on the sign-in screen."
      say "Stop anytime with: ${COMPOSE} down"
      exit 0
    fi
    sleep 1
  done
  err "Container is up but not answering yet — check: ${COMPOSE} logs -f"
  exit 1
else
  echo ""
  ok "Volunteertrac should be live → ${C_ACC}${URL}${C_RESET}"
  say "Stop anytime with: ${COMPOSE} down"
fi
