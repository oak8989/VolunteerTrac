#!/usr/bin/env bash
# Publish this project to GitHub as oak8989/volunteertrac
# Usage:
#   1. Create the repo first (one of):
#        gh repo create volunteertrac --public --source=. --remote=origin --push
#      or create an empty repo at https://github.com/new and run this script.
#   2. ./publish.sh
set -euo pipefail

OWNER="oak8989"
REPO="volunteertrac"
REMOTE_URL="https://github.com/${OWNER}/${REPO}.git"

echo "→ Publishing to ${REMOTE_URL}"

git init -b main 2>/dev/null || true
git remote remove origin 2>/dev/null || true
git remote add origin "${REMOTE_URL}"

git add .
git commit -m "Volunteertrac: self-contained volunteer time tracking (docker + compose)" || echo "→ Nothing new to commit"

git push -u origin main

echo ""
echo "✓ Pushed to https://github.com/${OWNER}/${REPO}"
echo "✓ Container image publishes automatically via .github/workflows/docker-publish.yml"
echo "  → ghcr.io/${OWNER}/${REPO}:latest"
