// Development / bare-static fallback. In Docker this file is regenerated at
// container boot from ADMIN_* / SMTP_* environment variables (see docker/entrypoint.sh).
window.__VOLUNTEERTRAC_CONFIG__ = {
  admin: {
    name: "Alex Morgan",
    email: "admin@volunteertrac.local",
    password: "changeme"
  },
  orgName: "",
  smtp: {
    host: "",
    port: "587",
    user: "",
    from: ""
  }
};
