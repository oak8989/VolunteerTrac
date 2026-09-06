#!/usr/bin/env bash
# Publish this project to GitHub as oak8989/volunteertrac
#
# Usage:
#   ./publish.sh                 publish the current branch (defaults to main)
#   ./publish.sh feat/my-change  create/switch to a branch and push it (PR-ready)
#   ./publish.sh --main          force-publish to main
#
# First time? Create the repo with either:
#   gh repo create volunteertrac --public --source=. --remote=origin --push
# or create an empty repo at https://github.com/new, then run this script.
set -euo pipefail

OWNER="oak8989"
REPO="volunteertrac"
REMOTE_URL="https://github.com/${OWNER}/${REPO}.git"

# ---------- resolve target branch ----------
ARG="${1:-}"
if [ "${ARG}" = "--main" ]; then
  BRANCH="main"
elif [ -n "${ARG}" ]; then
  BRANCH="${ARG}"
else
  BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo main)"
fi

echo "→ Publishing branch '${BRANCH}' to ${REMOTE_URL}"

git init -b main 2>/dev/null || true
git remote remove origin 2>/dev/null || true
git remote add origin "${REMOTE_URL}"

if [ "${BRANCH}" != "main" ]; then
  git checkout -B "${BRANCH}"
fi

git add .
if git diff --cached --quiet; then
  echo "→ Nothing new to commit"
else
  git commit -m "Volunteertrac: ${BRANCH/main/self-contained volunteer time tracking (docker + compose)}"
fi

git push -u origin "${BRANCH}"

echo ""
echo "✓ Pushed https://github.com/${OWNER}/${REPO}/tree/${BRANCH}"
if [ "${BRANCH}" != "main" ]; then
  echo "✓ Open a pull request: https://github.com/${OWNER}/${REPO}/compare/main...${BRANCH}?expand=1"
else
  echo "✓ Container image publishes automatically via .github/workflows/docker-publish.yml"
  echo "  → ghcr.io/${OWNER}/${REPO}:latest"
fi
