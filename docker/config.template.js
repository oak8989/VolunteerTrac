// Rendered by docker/entrypoint.sh via envsubst at container boot.
// Values come from docker-compose.yml / .env — never edit the generated file.
window.__VOLUNTEERTRAC_CONFIG__ = {
  admin: {
    name: "${ADMIN_NAME}",
    email: "${ADMIN_EMAIL}",
    password: "${ADMIN_PASSWORD}"
  },
  orgName: "${ORG_NAME}",
  smtp: {
    host: "${SMTP_HOST}",
    port: "${SMTP_PORT}",
    user: "${SMTP_USER}",
    from: "${SMTP_FROM}"
  }
};
