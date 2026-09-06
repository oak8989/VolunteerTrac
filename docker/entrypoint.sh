#!/bin/sh
# Runs from /docker-entrypoint.d before nginx starts.
# Renders container environment (docker-compose.yml / .env) into the SPA config.
set -e

: "${ADMIN_NAME:=Alex Morgan}"
: "${ADMIN_EMAIL:=admin@volunteertrac.local}"
: "${ADMIN_PASSWORD:=changeme}"
: "${ORG_NAME:=}"
: "${SMTP_HOST:=}"
: "${SMTP_PORT:=587}"
: "${SMTP_USER:=}"
: "${SMTP_FROM:=}"
export ADMIN_NAME ADMIN_EMAIL ADMIN_PASSWORD ORG_NAME SMTP_HOST SMTP_PORT SMTP_USER SMTP_FROM

envsubst < /etc/volunteertrac/config.template.js > /usr/share/nginx/html/config.js
echo "volunteertrac: provisioned admin ${ADMIN_EMAIL} (smtp: ${SMTP_HOST:-not configured})"
