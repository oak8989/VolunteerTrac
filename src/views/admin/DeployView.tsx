import { useEffect, useRef, useState } from "react";
import { useStore } from "../../lib/store";
import { downloadText, monthSeries, totalHours } from "../../lib/data";
import { cache, cached } from "../../lib/cache";
import { Bar, Btn, card, Chip, LiveDot, PageHead } from "../../components/ui";
import { IcCheck, IcCopy, IcDown, IcRocket, IcShield, IcTerminal } from "../../components/icons";

const VERSION = "v1.0.0";
const REPO = "https://github.com/oak8989/volunteertrac";
const IMAGE = "ghcr.io/oak8989/volunteertrac";

const COMPOSE_FILE = `# Volunteertrac — self-contained volunteer time tracking
# Usage:  docker compose up --build   →   http://localhost:8080
services:
  volunteertrac:
    build:
      context: .
      dockerfile: Dockerfile
    image: volunteertrac:latest
    container_name: volunteertrac
    restart: unless-stopped
    ports:
      - "\${PORT:-8080}:80"
    environment:
      - TZ=\${TZ:-UTC}
      # admin user provisioned at first boot
      - ADMIN_NAME=\${ADMIN_NAME:-Alex Morgan}
      - ADMIN_EMAIL=\${ADMIN_EMAIL:-admin@volunteertrac.local}
      - ADMIN_PASSWORD=\${ADMIN_PASSWORD:-changeme}
      # white-label org name (empty keeps the built-in default)
      - ORG_NAME=\${ORG_NAME:-}
      # email server (empty SMTP_HOST queues mail in the outbox)
      - SMTP_HOST=\${SMTP_HOST:-}
      - SMTP_PORT=\${SMTP_PORT:-587}
      - SMTP_USER=\${SMTP_USER:-}
      - SMTP_FROM=\${SMTP_FROM:-}
    healthcheck:
      test: ["CMD", "wget", "-qO", "/dev/null", "http://127.0.0.1/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

  cache:
    image: redis:7-alpine
    container_name: volunteertrac-cache
    command: ["redis-server", "--maxmemory", "64mb", "--maxmemory-policy", "allkeys-lru"]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 3s
      retries: 3
`;

async function copyText(t: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const { toast } = useStore();
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  const go = async () => {
    const ok = await copyText(text);
    setState(ok ? "ok" : "fail");
    toast(ok ? "ok" : "info", ok ? "Copied to clipboard" : "Clipboard blocked", ok ? undefined : "Select the text and press Ctrl+C");
    window.setTimeout(() => setState("idle"), 2200);
  };
  return (
    <button
      onClick={go}
      className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wide border transition cursor-pointer ${
        state === "ok"
          ? "border-pine-300 bg-pine-100 text-pine-800"
          : "border-white/15 text-pine-200 hover:text-paper hover:bg-white/10"
      }`}
    >
      {state === "ok" ? <IcCheck size={12} /> : <IcCopy size={12} />}
      {state === "ok" ? "Copied" : label}
    </button>
  );
}

function Terminal({ title, lines, tag, delay = 0 }: { title: string; lines: string[]; tag?: string; delay?: number }) {
  return (
    <div className="anim-rise rounded-xl overflow-hidden border border-pine-800 bg-pine-950 text-paper shadow-[0_14px_36px_-18px_rgba(5,20,15,.55)]" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-1.5 px-3.5 h-9 bg-pine-900/80 border-b border-white/10">
        <span className="w-2.5 h-2.5 rounded-full bg-clay/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-gold/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-pine-300/80" />
        <span className="font-mono text-[11px] text-pine-300 uppercase tracking-[0.14em] flex-1 pl-2.5">{title}</span>
        {tag && <Chip tone="acc" className="h-5 text-[9.5px]">{tag}</Chip>}
        <CopyBtn text={lines.join("\n")} />
      </div>
      <pre className="px-4 py-3.5 font-mono text-[12.5px] leading-[1.85] overflow-x-auto whitespace-pre">
        {lines.map((l, i) => (
          <div key={i}>
            <span className="select-none" style={{ color: "var(--acc)" }}>$ </span>
            {l}
          </div>
        ))}
        <span className="inline-block w-[7px] h-[14px] align-[-2px] ml-1" style={{ background: "var(--acc)", animation: "pulseDot 1.4s ease-out infinite" }} />
      </pre>
    </div>
  );
}

const PATHS: { title: string; tag?: string; sub: string; lines: string[] }[] = [
  {
    title: "bootstrap.sh",
    tag: "one command",
    sub: "Clones nothing you already have — checks Docker, builds, waits for health, prints the URL.",
    lines: ["git clone https://github.com/oak8989/volunteertrac.git", "cd volunteertrac", "./up.sh"],
  },
  {
    title: "docker compose",
    sub: "Plain compose from the repo root. Override the host port with PORT=9000 docker compose up -d.",
    lines: ["docker compose up -d --build", "open http://localhost:8080"],
  },
  {
    title: "published image",
    tag: "no clone",
    sub: "Pull the CI-built image straight from GitHub Container Registry — nothing to build.",
    lines: [`docker run -d -p 8080:80 --restart unless-stopped --name volunteertrac ${IMAGE}`],
  },
  {
    title: "local dev",
    tag: "no docker",
    sub: "Hot-reload dev server on :5173 — for tinkering with the source.",
    lines: ["npm install", "npm run dev"],
  },
];

const STEPS = [
  { t: "Install Docker", d: "docker.com — or `brew install --cask docker` on macOS." },
  { t: "Get the code", d: "git clone https://github.com/oak8989/volunteertrac.git" },
  { t: "Run the bootstrap", d: "./up.sh — or `make up` if you prefer Make." },
  { t: "Sign in", d: "Open http://localhost:8080 and pick any demo identity." },
];

const STORAGE_KEY = "volunteertrac:db"; // kept in sync with src/lib/store.tsx

const SECURITY = [
  { t: "Non-root runtime", d: "nginx serves as an unprivileged user — no root shell in the image" },
  { t: "Security headers", d: "CSP, X-Frame-Options DENY, nosniff and strict referrer on every response" },
  { t: "Multi-stage build", d: "toolchain and node_modules never reach the runtime image" },
  { t: "No baked-in secrets", d: "configuration flows through env vars only" },
  { t: "Healthchecked", d: "image and compose level; orchestration restarts on failure" },
];

export default function DeployView() {
  const { db, toast } = useStore();
  const [online, setOnline] = useState(() => navigator.onLine);
  const [, setTick] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Warm the TTL cache with hot aggregates every few seconds — the same
  // keys the dashboard and impact views read. Watch the hit-rate climb.
  useEffect(() => {
    const warm = () => {
      cached(`impact:hours:${db.attendance.length}`, () => totalHours(db));
      cached(`impact:series:${db.attendance.length}`, () => monthSeries(db, 8));
      setTick((x) => x + 1);
    };
    warm();
    const i = window.setInterval(warm, 2500);
    return () => window.clearInterval(i);
  }, [db]);
  const cstats = cache.stats();

  let storedBytes = 0;
  try { storedBytes = localStorage.getItem(STORAGE_KEY)?.length || 0; } catch { storedBytes = 0; }
  const uploads = (db.org.logoDataUrl ? 1 : 0);

  const onImport = (f: File | undefined) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result));
        if (!data?.org || !Array.isArray(data.members) || !Array.isArray(data.events) || !Array.isArray(data.attendance)) throw new Error("shape");
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        toast("ok", "Backup restored", "Reloading with the imported dataset…");
        window.setTimeout(() => window.location.reload(), 900);
      } catch {
        toast("warn", "Not a valid backup", "Expected a volunteertrac-data.json export");
      }
    };
    r.readAsText(f);
  };
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const host = window.location.hostname || "localhost";
  const secure = window.location.protocol === "https:";
  let storageKB = 0;
  try { storageKB = Math.round(JSON.stringify(db).length / 1024); } catch { storageKB = 0; }

  return (
    <>
      <PageHead eyebrow="Ship it in one command" title="Setup & deploy" sub="Volunteertrac is a single self-contained container — no database, no secrets, nothing required beyond Docker (Redis ships as an optional scale-out tier). Everything below is copy-paste ready.">
        <a href={REPO} target="_blank" rel="noreferrer" className="no-underline">
          <Btn variant="line"><IcRocket size={15} /> github.com/oak8989</Btn>
        </a>
        <Btn onClick={() => downloadText("docker-compose.yml", COMPOSE_FILE)}>
          <IcDown size={15} /> docker-compose.yml
        </Btn>
      </PageHead>

      {/* live instance strip */}
      <div className={`${card} px-5 py-4 mb-5 anim-rise`}>
        <div className="flex items-center gap-2 mb-3">
          <LiveDot />
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-soft">This instance · {VERSION}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3">
          {[
            { l: "Status", v: online ? "online" : "offline", mono: true, tone: online ? "text-pine-700" : "text-clay" },
            { l: "Served from", v: host === "" ? "localhost" : host, mono: true },
            { l: "Transport", v: secure ? "https · secure" : "http", mono: true },
            { l: "Stored data", v: `${storageKB} KB · localStorage`, mono: true },
          ].map((s, i) => (
            <div key={s.l} className={`pr-4 ${i > 0 ? "sm:border-l sm:border-line sm:pl-4" : ""}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-faint">{s.l}</p>
              <p className={`text-[13.5px] font-semibold mt-0.5 truncate ${s.mono ? "font-mono text-[12.5px]" : ""} ${s.tone || ""}`}>{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* left: paths */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-[9px] flex items-center justify-center text-paper" style={{ background: "var(--acc)", color: "var(--acc-ink)" }}>
              <IcTerminal size={16} />
            </span>
            <h2 className="font-display font-bold text-[17px]">Four ways in, pick the laziest</h2>
          </div>
          {PATHS.map((p, i) => (
            <div key={p.title}>
              <div className="flex items-baseline justify-between mb-1.5 px-0.5">
                <p className="text-[13px] font-bold">{i + 1}. <span className="font-mono">{p.title}</span></p>
              </div>
              <Terminal title={p.title} tag={p.tag} lines={p.lines} delay={i * 70} />
              <p className="text-[12px] text-soft mt-1.5 px-0.5">{p.sub}</p>
            </div>
          ))}
        </div>

        {/* right: checklist + env + compose */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "100ms" }}>
            <h2 className="font-display font-bold text-[16px] mb-4">Four steps to live</h2>
            <div className="relative space-y-4 before:absolute before:left-[13px] before:top-3 before:bottom-3 before:w-px before:bg-line">
              {STEPS.map((s, i) => (
                <div key={s.t} className="relative flex gap-3 anim-rise" style={{ animationDelay: `${200 + i * 120}ms` }}>
                  <span className="relative z-10 w-[27px] h-[27px] shrink-0 rounded-full flex items-center justify-center border border-line font-mono text-[11.5px] font-bold" style={{ background: "color-mix(in srgb, var(--acc) 16%, white)", color: "var(--acc-deep)" }}>
                    {i + 1}
                  </span>
                  <div className="pt-0.5 min-w-0">
                    <p className="text-[13px] font-bold">{s.t}</p>
                    <p className="text-[12px] text-soft font-mono mt-0.5 break-all">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3.5 border-t border-line flex items-center justify-between gap-2">
              <p className="text-[11px] font-mono text-faint truncate">image · {IMAGE}</p>
              <CopyBtn text={IMAGE} label="Copy image" />
            </div>
          </section>

          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "220ms" }}>
            <h2 className="font-display font-bold text-[16px] mb-3.5">Environment (all optional)</h2>
            <div className="divide-y divide-line">
              {[
                { k: "PORT", v: "8080", d: "host port the app answers on" },
                { k: "TZ", v: "UTC", d: "container timezone for logs" },
              ].map((e) => (
                <div key={e.k} className="flex items-center gap-3 py-2.5">
                  <span className="font-mono text-[12px] font-bold bg-pine-100 text-pine-800 rounded-md px-2 py-0.5">{e.k}</span>
                  <span className="text-[12px] text-soft flex-1">{e.d}</span>
                  <span className="font-mono text-[12px] text-faint tnum">default {e.v}</span>
                </div>
              ))}
            </div>
            <p className="text-[11.5px] text-faint mt-3">Copy <span className="font-mono">.env.example</span> → <span className="font-mono">.env</span> and compose picks it up automatically.</p>
          </section>

          {/* cache layer */}
          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "280ms" }}>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="font-display font-bold text-[16px]">Cache layer</h2>
              <div className="flex items-center gap-2">
                <Chip tone="live"><LiveDot /> live</Chip>
                <Btn size="sm" variant="ghost" onClick={() => { cache.clear(); setTick((x) => x + 1); toast("info", "Cache flushed", "Next read recomputes from the ledger"); }}>
                  Flush
                </Btn>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { l: "hits", v: cstats.hits },
                { l: "misses", v: cstats.misses },
                { l: "evicted", v: cstats.evictions },
                { l: "entries", v: cstats.entries },
              ].map((s) => (
                <div key={s.l} className="bg-paper/80 border border-line rounded-[9px] px-2.5 py-2 text-center">
                  <p className="font-mono font-bold text-[17px] tnum leading-none">{s.v}</p>
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-faint mt-1">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="mt-3.5">
              <div className="flex justify-between text-[11px] font-mono text-soft mb-1.5">
                <span>hit rate</span>
                <span className="tnum font-bold text-ink">{cstats.hitRate}%</span>
              </div>
              <Bar value={cstats.hitRate / 100} />
            </div>
            <p className="text-[11.5px] text-faint mt-3">
              TTL {cstats.ttlS}s · LRU 128 entries, in-browser. Compose runs <span className="font-mono">redis:7-alpine</span> with <span className="font-mono">allkeys-lru</span> as the shared tier for an API backend.
            </p>
          </section>

          {/* security posture */}
          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "320ms" }}>
            <h2 className="font-display font-bold text-[16px] mb-4 flex items-center gap-2">
              <IcShield size={17} className="text-pine-700" /> Security posture
            </h2>
            <div className="space-y-3">
              {SECURITY.map((s, i) => (
                <div key={s.t} className="flex gap-2.5 anim-rise" style={{ animationDelay: `${360 + i * 60}ms` }}>
                  <span className="w-[22px] h-[22px] shrink-0 rounded-full flex items-center justify-center mt-0.5" style={{ background: "color-mix(in srgb, var(--acc) 16%, white)", color: "var(--acc-deep)" }}>
                    <IcCheck size={12} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold leading-tight">{s.t}</p>
                    <p className="text-[11.5px] text-soft mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* persistent storage */}
          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "360ms" }}>
            <h2 className="font-display font-bold text-[16px] mb-3.5">Persistent storage</h2>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11.5px] font-bold bg-pine-100 text-pine-800 rounded-md px-2 py-0.5">{STORAGE_KEY}</span>
                <span className="text-[12px] text-soft flex-1">browser-persistent ledger</span>
                <span className="font-mono text-[12px] tnum font-semibold">{Math.max(1, Math.round(storedBytes / 1024))} KB</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11.5px] font-bold bg-pine-100 text-pine-800 rounded-md px-2 py-0.5">uploads</span>
                <span className="text-[12px] text-soft flex-1">logo & brand assets, stored inline</span>
                <span className="font-mono text-[12px] tnum font-semibold">{uploads} file{uploads === 1 ? "" : "s"}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Btn size="sm" variant="soft" onClick={() => { downloadText(`volunteertrac-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(db, null, 2)); toast("ok", "Backup exported", "Keep it somewhere safe — restores in one click"); }}>
                <IcDown size={13} /> Export backup
              </Btn>
              <Btn size="sm" variant="line" onClick={() => fileRef.current?.click()}>
                <IcCopy size={13} /> Import backup
              </Btn>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            <p className="text-[11.5px] text-faint mt-3">
              The container is stateless by design — data lives with the browser, survives restarts, and round-trips through validated JSON backups.
            </p>
          </section>

          <section className="anim-rise" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <p className="text-[13px] font-bold">The whole orchestration file</p>
            </div>
            <Terminal title="docker-compose.yml" lines={COMPOSE_FILE.trim().split("\n")} />
            <div className="flex gap-2 mt-2 px-0.5">
              <Btn size="sm" variant="line" onClick={() => downloadText("docker-compose.yml", COMPOSE_FILE)}>
                <IcDown size={13} /> Download
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => copyText(COMPOSE_FILE)} className="text-soft">
                <IcCopy size={13} /> Copy file
              </Btn>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
