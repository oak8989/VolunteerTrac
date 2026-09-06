# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# install deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# build the app
COPY . .
RUN npm run build

# ---------- runtime stage ----------
# nginx:alpine runs scripts in /docker-entrypoint.d/ before starting,
# as a non-root-friendly unprivileged user via the stock entrypoint.
FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# container-boot provisioning: ADMIN_* / SMTP_* env → /usr/share/nginx/html/config.js
COPY docker/config.template.js /etc/volunteertrac/config.template.js
COPY docker/entrypoint.sh /docker-entrypoint.d/40-volunteertrac.sh
RUN chmod +x /docker-entrypoint.d/40-volunteertrac.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1/ || exit 1
