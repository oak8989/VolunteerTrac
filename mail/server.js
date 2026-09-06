/**
 * volunteertrac-mailer — internal SMTP relay.
 * Listens on :8025 inside the docker network (never published to the host);
 * nginx proxies /api/mail/ → this service.
 *
 *   GET  /health        → { ok, configured }
 *   POST /send          → { to, subject, text?, smtp? { host, port, user, pass, from } }
 *                        → 200 { ok, messageId } | 502 SMTP error | 503 not configured
 */
const http = require("http");
const nodemailer = require("nodemailer");

const JSON_HDR = { "Content-Type": "application/json" };

const envSmtp = {
  host: (process.env.SMTP_HOST || "").trim(),
  port: Number(process.env.SMTP_PORT || 587),
  user: (process.env.SMTP_USER || "").trim(),
  pass: (process.env.SMTP_PASS || "").trim(),
  from: (process.env.SMTP_FROM || "").trim() || "Volunteertrac <noreply@volunteertrac.local>",
};

const configured = envSmtp.host.length > 0;

// transporters keyed by host:port:user so repeated sends reuse connections
const transporters = new Map();

function transporterFor(s) {
  const key = `${s.host}:${s.port}:${s.user}`;
  if (!transporters.has(key)) {
    transporters.set(
      key,
      nodemailer.createTransport({
        host: s.host,
        port: s.port,
        secure: s.port === 465,
        auth: s.user ? { user: s.user, pass: s.pass } : undefined,
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 9000,
      })
    );
  }
  return transporters.get(key);
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/health" || req.url === "/")) {
    res.writeHead(200, JSON_HDR);
    return res.end(JSON.stringify({ ok: true, configured, service: "volunteertrac-mailer" }));
  }

  if (req.method === "POST" && req.url === "/send") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 200000) req.destroy();
    });
    req.on("end", async () => {
      let payload;
      try {
        payload = JSON.parse(body || "{}");
      } catch {
        payload = {};
      }
      const to = String(payload.to || "").trim();
      const subject = String(payload.subject || "").trim();
      if (!to || !subject) {
        res.writeHead(400, JSON_HDR);
        return res.end(JSON.stringify({ ok: false, error: "to and subject are required" }));
      }

      // per-request overrides (from the app's Email settings) win over env
      const ov = payload.smtp || {};
      const smtp = {
        host: String(ov.host || envSmtp.host).trim(),
        port: Number(ov.port || envSmtp.port),
        user: String(ov.user != null ? ov.user : envSmtp.user).trim(),
        pass: String(ov.pass != null ? ov.pass : envSmtp.pass).trim(),
        from: String(ov.from || envSmtp.from).trim(),
      };

      if (!smtp.host) {
        res.writeHead(503, JSON_HDR);
        return res.end(JSON.stringify({ ok: false, error: "no SMTP host configured (env SMTP_HOST or payload smtp.host)" }));
      }

      try {
        const info = await transporterFor(smtp).sendMail({
          from: smtp.from,
          to,
          subject,
          text: String(payload.text || `${subject}\n\n— sent by Volunteertrac`),
        });
        res.writeHead(200, JSON_HDR);
        res.end(JSON.stringify({ ok: true, messageId: info.messageId }));
      } catch (err) {
        res.writeHead(502, JSON_HDR);
        res.end(JSON.stringify({ ok: false, error: (err && err.message) || "SMTP send failed" }));
      }
    });
    return;
  }

  res.writeHead(404, JSON_HDR);
  res.end(JSON.stringify({ ok: false, error: "not found" }));
});

server.listen(8025, "0.0.0.0", () => {
  console.log(
    `volunteertrac-mailer listening on :8025 — smtp ${configured ? `${envSmtp.host}:${envSmtp.port}` : "not configured (waiting for app-side settings)"}`
  );
});
