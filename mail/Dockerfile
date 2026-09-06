FROM node:20-alpine

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY server.js ./

# run unprivileged
USER node
EXPOSE 8025

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:8025/health || exit 1

CMD ["node", "server.js"]
