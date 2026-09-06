import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useStore } from "../lib/store";
import { appConfig } from "../lib/config";
import type { EventItem, Member } from "../lib/data";
import { eventState, fmtDay, fmtMoney, fmtTime, fullName, recordsFor, relTime, tierFor, totalHours } from "../lib/data";
import { Btn, Chip, Clock, Field, Input, LiveDot, Modal, Rosette, useCountUp } from "../components/ui";
import { IcCal, IcCard, IcCheck, IcMedal, IcPin, IcQr, IcShield, IcSpark, LogoMark } from "../components/icons";

type Tab = "signin" | "signup" | "reset";

export default function Landing() {
  const { db, attemptLogin, createAccount, resetPassword, register, toast } = useStore();
  const [tab, setTab] = useState<Tab | null>(null);
  const [pending, setPending] = useState<EventItem | null>(null);
  const [tick, setTick] = useState(0);
  const [hi, setHi] = useState(0);

  useEffect(() => {
    const i = window.setInterval(() => setTick((x) => x + 1), 5000);
    return () => window.clearInterval(i);
  }, []);

  const feed = useMemo(
    () => db.activity.filter((a) => ["checkin", "walkin", "register", "payment", "medal"].includes(a.kind)).slice(0, 7),
    [db.activity]
  );
  useEffect(() => {
    if (feed.length < 2) return;
    const i = window.setInterval(() => setHi((h) => (h + 1) % feed.length), 2600);
    return () => window.clearInterval(i);
  }, [feed.length]);

  const liveEvents = db.events.filter((e) => e.type === "public" && eventState(e) === "live");
  const onShift = db.attendance.filter((a) => a.checkIn && !a.checkOut).length;

  // hours contributed today (completed + in-progress)
  const todayH = useMemo(() => {
    const now = Date.now();
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    let h = 0;
    db.attendance.forEach((a) => {
      if (!a.checkIn) return;
      const ci = new Date(a.checkIn).getTime();
      if (ci < d0.getTime()) return;
      const co = a.checkOut ? new Date(a.checkOut).getTime() : now;
      h += Math.max(0, (co - ci) / 3600000);
    });
    return Math.round(h * 10) / 10;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.attendance, tick]);

  const openAuth = (t: Tab, ev?: EventItem) => { setPending(ev || null); setTab(t); };

  const afterLogin = (m: Member) => {
    if (pending) {
      if (pending.fee > 0) {
        toast("info", "One more step", `${pending.title} has a ${fmtMoney(pending.fee)} fee — finish payment from your portal.`);
      } else {
        register(pending.id, m.id);
      }
    }
    setPending(null);
    setTab(null);
  };

  return (
    <div className="min-h-screen">
      {/* ---------- nav ---------- */}
      <header className="sticky top-0 z-50 bg-paper/85 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-[1120px] px-5 h-[62px] flex items-center gap-6">
          <a href="#top" className="flex items-center gap-2.5 no-underline text-ink">
            {db.org.logoDataUrl ? <img src={db.org.logoDataUrl} alt="" className="w-9 h-9 rounded-[10px] object-cover" /> : <LogoMark variant={db.org.logoMark} size={36} />}
            <span>
              <span className="block font-display font-bold text-[14.5px] leading-tight">{db.org.name}</span>
              <span className="block text-[9px] font-mono uppercase tracking-[0.18em] text-faint">volunteertrac</span>
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-5 ml-4 text-[13px] font-semibold text-soft">
            <a href="#events" className="hover:text-ink transition-colors no-underline text-soft">Events</a>
            <a href="#impact" className="hover:text-ink transition-colors no-underline text-soft">Impact</a>
            <a href="#mission" className="hover:text-ink transition-colors no-underline text-soft">Mission</a>
            <a href="#contact" className="hover:text-ink transition-colors no-underline text-soft">Contact</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Btn variant="ghost" onClick={() => openAuth("signin")}><IcShield size={14} /> Sign in</Btn>
            <Btn onClick={() => openAuth("signup")}>Volunteer with us</Btn>
          </div>
        </div>
      </header>

      {/* ---------- opening: the front-desk board ---------- */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 dotsbg opacity-30 pointer-events-none" />
        <div className="relative mx-auto max-w-[1120px] px-5 pt-12 pb-14 lg:pt-16 lg:pb-20 grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 anim-rise">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-pine-800 bg-pine-100 rounded-full px-3.5 py-1.5">
              <LiveDot /> {onShift > 0 ? `${onShift} volunteers on shift right now` : "Volunteer-powered since day one"}
            </p>
            <h1 className="font-display font-bold tracking-tight text-[42px] sm:text-[56px] leading-[1.02] mt-5">
              Time given is<br />
              <span style={{ color: "var(--acc-deep)" }}>never lost.</span>
            </h1>
            <p className="text-[16px] text-soft leading-relaxed mt-5 max-w-[520px]">{db.org.tagline}</p>
            <div className="flex flex-wrap gap-2.5 mt-7">
              <Btn size="lg" onClick={() => { document.getElementById("events")?.scrollIntoView({ behavior: "smooth" }); }}>
                <IcCal size={16} /> See upcoming events
              </Btn>
              <Btn size="lg" variant="dark" onClick={() => openAuth("signup")}>Create a volunteer account</Btn>
            </div>
            <div className="grid grid-cols-3 max-w-[460px] gap-3 mt-10">
              <HeroStat v={`${todayH}`} suffix="h" l="given today" live />
              <HeroStat v={`${db.members.filter((m) => m.active && m.role === "member").length}`} l="active volunteers" />
              <HeroStat v={`${db.org.tiers.length}`} l="medal tiers" medals />
            </div>
          </div>

          {/* the board */}
          <div className="lg:col-span-5 anim-rise" style={{ animationDelay: "120ms" }}>
            <div className="relative bg-pine-950 text-paper rounded-2xl border border-pine-800 shadow-[0_28px_60px_-24px_rgba(5,20,15,.55)] overflow-hidden anim-floaty">
              <div className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(420px 240px at 85% -10%, color-mix(in srgb, var(--acc) 26%, transparent), transparent 60%)" }} />
              <div className="relative px-5 pt-4.5 pb-4 flex items-center gap-2.5 border-b border-white/10">
                <LiveDot />
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-pine-200 flex-1">Front desk · live punch board</p>
                <Clock className="text-[12.5px] text-[var(--acc)]" />
              </div>

              {liveEvents.length > 0 ? (
                <div className="relative px-5 py-4 border-b border-white/10">
                  {liveEvents.slice(0, 2).map((e) => {
                    const n = recordsFor(db, e.id).filter((r) => r.checkIn && !r.checkOut).length;
                    return (
                      <div key={e.id} className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--acc) 22%, transparent)", color: "var(--acc)" }}>
                          <IcCal size={19} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-bold text-[15px] leading-tight truncate">{e.title}</p>
                          <p className="font-mono text-[10.5px] text-pine-300 mt-0.5">{e.location} · until {fmtTime(e.end)}</p>
                        </div>
                        <Chip tone="live"><LiveDot /> {n} on shift</Chip>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="relative px-5 py-4 border-b border-white/10">
                  <p className="font-display font-bold text-[15px]">No shift running right now</p>
                  <p className="font-mono text-[10.5px] text-pine-300 mt-1">
                    Next up: {db.events.filter((e) => e.type === "public" && eventState(e) === "upcoming").sort((a, b) => a.start.localeCompare(b.start))[0]?.title || "—"}
                  </p>
                </div>
              )}

              <div className="relative px-3 py-3 space-y-1 min-h-[252px]">
                {feed.map((a, i) => (
                  <div
                    key={a.id}
                    className={`flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 transition-all duration-500 ${i === hi ? "bg-white/8 -translate-x-0" : "opacity-75"}`}
                    style={i === hi ? { boxShadow: "inset 2.5px 0 0 var(--acc)" } : undefined}
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--acc) 18%, transparent)", color: "var(--acc)" }}>
                      {a.kind === "medal" ? <IcMedal size={12} /> : a.kind === "walkin" ? <IcQr size={12} /> : a.kind === "payment" ? <IcCard size={12} /> : a.kind === "register" ? <IcCal size={12} /> : <IcCheck size={12} />}
                    </span>
                    <p className="text-[12px] leading-snug flex-1 truncate text-pine-100">{a.text}</p>
                    <span className="font-mono text-[9.5px] text-pine-300 shrink-0 tnum">{relTime(a.at)}</span>
                  </div>
                ))}
              </div>

              <div className="relative px-5 py-3 border-t border-white/10 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-pine-300">QR walk-ins welcome</p>
                <p className="font-mono text-[11px] tnum" style={{ color: "var(--acc)" }}>{todayH}h today</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- events ---------- */}
      <EventsSection db={db} onRegister={(e) => openAuth("signup", e)} />

      {/* ---------- impact band ---------- */}
      <ImpactBand />

      {/* ---------- mission ---------- */}
      <section id="mission" className="mx-auto max-w-[1120px] px-5 py-16 lg:py-20 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: "var(--acc-deep)" }}>Our mission</p>
          <h2 className="font-display font-bold text-[30px] sm:text-[36px] leading-[1.06] tracking-tight">{db.org.name}</h2>
          <div className="flex items-center gap-3 mt-5">
            {db.org.logoDataUrl ? <img src={db.org.logoDataUrl} alt="" className="w-12 h-12 rounded-[12px] object-cover border border-line" /> : <LogoMark variant={db.org.logoMark} size={48} />}
            <div>
              <p className="font-mono text-[11px] text-faint">EIN {db.org.ein}</p>
              <p className="text-[12.5px] text-soft">{db.org.address}</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-7">
          <p className="text-[17px] leading-relaxed text-ink/85">{db.org.mission}</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-7">
            {[
              { icon: <IcQr size={17} />, t: "Show up, scan, serve", d: "Walk-in QR check-in means no clipboards at the door — your hours start the moment you arrive." },
              { icon: <IcMedal size={17} />, t: "Earn medals as you give", d: "Hour milestones unlock medals automatically. Your progress lives in your member portal." },
              { icon: <IcShield size={17} />, t: "Waivers handled once", d: `Sign the ${db.org.waiver.title} once and every future registration is one tap.` },
              { icon: <IcSpark size={17} />, t: "See the difference", d: `Every hour is valued at ${fmtMoney(db.org.valuePerHour)} of community impact — tracked per member, per event, overall.` },
            ].map((f, i) => (
              <div key={f.t} className="rounded-xl border border-line bg-panel px-4.5 py-4 hover:border-[var(--acc)] hover:-translate-y-0.5 transition-all duration-200 anim-rise" style={{ animationDelay: `${i * 70}ms` }}>
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] mb-3" style={{ background: "color-mix(in srgb, var(--acc) 15%, white)", color: "var(--acc-deep)" }}>{f.icon}</span>
                <p className="font-display font-bold text-[14.5px]">{f.t}</p>
                <p className="text-[12.5px] text-soft mt-1 leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer id="contact" className="bg-pine-950 text-paper mt-4">
        <div className="mx-auto max-w-[1120px] px-5 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark variant={db.org.logoMark} size={34} bg="rgba(255,255,255,0.07)" />
              <p className="font-display font-bold text-[15px]">{db.org.name}</p>
            </div>
            <p className="text-[12px] text-pine-300 mt-3 leading-relaxed">{db.org.tagline}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-pine-300 mb-3">Reach us</p>
            <p className="text-[13px]">{db.org.email}</p>
            <p className="text-[13px] mt-1.5">{db.org.phone}</p>
            <p className="text-[13px] mt-1.5 text-pine-200">{db.org.address}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-pine-300 mb-3">Members</p>
            <button onClick={() => openAuth("signin")} className="block text-[13px] text-pine-100 hover:text-paper transition cursor-pointer">Volunteer sign in</button>
            <button onClick={() => openAuth("signup")} className="block text-[13px] text-pine-100 hover:text-paper mt-1.5 transition cursor-pointer">Create an account</button>
            <button onClick={() => openAuth("reset")} className="block text-[13px] text-pine-100 hover:text-paper mt-1.5 transition cursor-pointer">Reset password</button>
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-pine-300 mb-3">Platform</p>
            <p className="text-[12px] text-pine-200 leading-relaxed">
              Running on <span className="font-mono text-paper">Volunteertrac</span> — self-hosted volunteer time tracking.
            </p>
            <p className="font-mono text-[11px] text-pine-300 mt-2.5">github.com/oak8989/volunteertrac</p>
            <p className="font-mono text-[11px] text-pine-300 mt-1">docker compose up --build</p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-[1120px] px-5 py-4 font-mono text-[10.5px] text-pine-300">
            EIN {db.org.ein} · self-hosted with Volunteertrac · one container, no cloud
          </p>
        </div>
      </footer>

      <AuthModal tab={tab} setTab={setTab} pending={pending} onClose={() => { setTab(null); setPending(null); }} afterLogin={afterLogin}
        attemptLogin={attemptLogin} createAccount={createAccount} resetPassword={resetPassword} db={db} />
    </div>
  );
}

function HeroStat({ v, l, suffix = "", live = false, medals = false }: { v: string; l: string; suffix?: string; live?: boolean; medals?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-panel/80 px-4 py-3.5 hover:border-[var(--acc)] transition-colors">
      <p className="font-mono font-bold text-[24px] tnum leading-none flex items-center gap-2">
        {v}<span className="text-[14px] text-soft">{suffix}</span>
        {live && <LiveDot />}
        {medals && <IcMedal size={16} className="text-[#c99322]" />}
      </p>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-faint mt-1.5">{l}</p>
    </div>
  );
}

/* ================= events ================= */

function EventsSection({ db, onRegister }: { db: ReturnType<typeof useStore>["db"]; onRegister: (e: EventItem) => void }) {
  const list = db.events
    .filter((e) => e.type === "public" && eventState(e) !== "past")
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 6);
  return (
    <section id="events" className="mx-auto max-w-[1120px] px-5 py-14 lg:py-18">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: "var(--acc-deep)" }}>Open to everyone</p>
          <h2 className="font-display font-bold text-[30px] sm:text-[34px] tracking-tight leading-tight">Up next on the calendar</h2>
        </div>
        <p className="text-[13px] text-soft max-w-[340px]">Register with a free account. Fee-based trainings check out securely at signup.</p>
      </div>
      <div className="space-y-2.5">
        {list.map((e, i) => {
          const regs = recordsFor(db, e.id).length;
          const live = eventState(e) === "live";
          const d = new Date(e.start);
          return (
            <div
              key={e.id}
              className="anim-rise group flex flex-wrap items-center gap-4 rounded-xl border border-line bg-panel px-4 py-4 transition-all duration-200 hover:border-[var(--acc)] hover:shadow-[0_10px_28px_-14px_rgba(20,40,30,.35)] hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className={`w-14 shrink-0 rounded-[10px] text-center py-2 border ${live ? "bg-pine-900 border-pine-900 text-paper" : "bg-white/70 border-line"}`}>
                <span className={`block text-[9.5px] font-bold uppercase tracking-wider ${live ? "text-[var(--acc)]" : "text-faint"}`}>{d.toLocaleDateString([], { weekday: "short" })}</span>
                <span className="block font-display font-bold text-[21px] leading-tight tnum">{d.getDate()}</span>
                <span className={`block text-[9.5px] font-bold uppercase ${live ? "text-pine-200" : "text-faint"}`}>{d.toLocaleDateString([], { month: "short" })}</span>
              </span>
              <div className="min-w-0 flex-1 basis-56">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-bold text-[15.5px]">{e.title}</p>
                  {live && <Chip tone="live"><LiveDot /> live now</Chip>}
                  {e.fee > 0 && <Chip tone="gold"><IcCard size={10} /> {fmtMoney(e.fee)}</Chip>}
                  {e.requireWaiver && <Chip tone="line"><IcShield size={10} /> waiver</Chip>}
                </div>
                <p className="font-mono text-[11.5px] text-soft mt-1">{fmtTime(e.start)}–{fmtTime(e.end)} · {e.location}</p>
                {e.description && <p className="text-[12px] text-faint mt-1 line-clamp-1">{e.description}</p>}
              </div>
              <div className="w-36 shrink-0 hidden sm:block">
                <div className="flex justify-between text-[10.5px] font-mono text-soft mb-1 tnum">
                  <span>{regs}/{e.capacity} spots</span>
                  <span>{fmtDay(e.start)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-line overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (regs / e.capacity) * 100)}%`, background: regs >= e.capacity ? "var(--color-clay)" : "var(--acc)" }} />
                </div>
              </div>
              <Btn onClick={() => onRegister(e)} disabled={regs >= e.capacity} className="shrink-0">
                {regs >= e.capacity ? "Full" : live ? "Join walk-in" : e.fee > 0 ? `Register · ${fmtMoney(e.fee)}` : "Register free"}
              </Btn>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ================= impact ================= */

function ImpactBand() {
  const { db } = useStore();
  const th = totalHours(db);
  const hours = useCountUp(th, 1200);
  const value = useCountUp(th * db.org.valuePerHour, 1200);
  const vols = db.members.filter((m) => m.active && m.role === "member").length;
  const medaled = db.members.filter((m) => tierFor(db.org.tiers, db.attendance.filter((a) => a.memberId === m.id).reduce((s, a) => s + (a.checkIn && a.checkOut ? (new Date(a.checkOut!).getTime() - new Date(a.checkIn!).getTime()) / 3600000 : 0), 0))).length;
  const tiersSorted = [...db.org.tiers].sort((a, b) => a.hours - b.hours);
  return (
    <section id="impact" className="relative bg-pine-950 text-paper overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(700px 320px at 15% 0%, color-mix(in srgb, var(--acc) 16%, transparent), transparent 60%), radial-gradient(600px 380px at 95% 100%, rgba(42,119,96,.35), transparent 62%)" }} />
      <div className="absolute inset-0 dotsbg opacity-[0.05]" />
      <div className="relative mx-auto max-w-[1120px] px-5 py-14 lg:py-18">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-9">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-pine-300 mb-2">Track the impact</p>
            <h2 className="font-display font-bold text-[30px] sm:text-[36px] tracking-tight leading-tight">The ledger we're proud of</h2>
          </div>
          <p className="font-mono text-[11.5px] text-pine-300">valued at {fmtMoney(db.org.valuePerHour)}/volunteer hour</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <BandStat v={`${Math.round(hours)}`} s="h" l="volunteer hours logged" />
          <BandStat v={`$${Math.round(value).toLocaleString()}`} l="estimated community value" />
          <BandStat v={`${vols}`} l="active volunteers" />
          <BandStat v={`${medaled}`} l="medals earned" />
        </div>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3 mt-10 pt-7 border-t border-white/10">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-pine-300">Medal track</p>
          {tiersSorted.map((t) => (
            <span key={t.name} className="flex items-center gap-2 text-[13px] font-semibold">
              <Rosette color={t.color} size={22} /> {t.name}
              <span className="font-mono text-[10.5px] text-pine-300 tnum">{t.hours}h+</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function BandStat({ v, s, l }: { v: string; s?: string; l: string }) {
  return (
    <div>
      <p className="font-display font-bold text-[40px] sm:text-[46px] leading-none tnum" style={{ color: "var(--acc)" }}>
        {v}{s && <span className="text-[22px]">{s}</span>}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-pine-300 mt-2.5">{l}</p>
    </div>
  );
}

/* ================= auth modal ================= */

function AuthModal({
  tab, setTab, pending, onClose, afterLogin, attemptLogin, createAccount, resetPassword, db,
}: {
  tab: Tab | null;
  setTab: (t: Tab | null) => void;
  pending: EventItem | null;
  onClose: () => void;
  afterLogin: (m: Member) => void;
  attemptLogin: (e: string, p: string) => { member?: Member; error?: string };
  createAccount: (d: { firstName: string; lastName: string; email: string; password: string }) => { member?: Member; error?: string };
  resetPassword: (e: string) => boolean;
  db: ReturnType<typeof useStore>["db"];
}) {
  // First run in this browser: prefill the admin credentials provisioned by
  // docker-compose (ADMIN_EMAIL / ADMIN_PASSWORD) so the workspace is reachable.
  const firstRunRef = useRef<boolean | null>(null);
  if (firstRunRef.current === null) {
    try {
      firstRunRef.current = !localStorage.getItem("vt:run");
      if (firstRunRef.current) localStorage.setItem("vt:run", "1");
    } catch {
      firstRunRef.current = false;
    }
  }
  const firstRun = firstRunRef.current;
  const [email, setEmail] = useState(() => (firstRun ? appConfig.admin.email : ""));
  const [pw, setPw] = useState(() => (firstRun ? appConfig.admin.password : ""));
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => { setErr(""); setNote(""); }, [tab]);

  const submitSignin = (e: FormEvent) => {
    e.preventDefault();
    const r = attemptLogin(email, pw);
    if (r.error) return setErr(r.error);
    if (r.member) afterLogin(r.member);
  };
  const submitSignup = (e: FormEvent) => {
    e.preventDefault();
    if (first.trim().length < 2 || last.trim().length < 2) return setErr("First and last name are required.");
    if (!/.+@.+\..+/.test(email)) return setErr("Enter a valid email — confirmations go there.");
    if (pw.length < 6) return setErr("Password needs at least 6 characters.");
    const r = createAccount({ firstName: first, lastName: last, email, password: pw });
    if (r.error) return setErr(r.error);
    if (r.member) afterLogin(r.member);
  };
  const submitReset = (e: FormEvent) => {
    e.preventDefault();
    if (!resetPassword(email)) return setErr("No account found with that email.");
    setNote("Reset link sent — check your inbox.");
    setTab("signin");
  };

  return (
    <Modal
      open={tab !== null}
      onClose={onClose}
      title={tab === "signup" ? "Create your volunteer account" : tab === "reset" ? "Reset your password" : "Member sign in"}
      sub={
        pending
          ? `Registering for ${pending.title}${pending.fee > 0 ? ` · ${fmtMoney(pending.fee)} fee at checkout` : " · free event"}`
          : tab === "signup"
            ? "Free forever. Confirmations, waivers and medals live in your portal."
            : `${db.org.name} member & admin access`
      }
      w={470}
    >
      {pending && (
        <div className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 mb-4 text-[12.5px] font-semibold" style={{ background: "color-mix(in srgb, var(--acc) 12%, white)", color: "var(--acc-deep)" }}>
          <IcCal size={15} /> {fmtDay(pending.start)} · {fmtTime(pending.start)} — you'll be registered after signing in
        </div>
      )}

      {(tab === "signin" || tab === "signup") && (
        <div className="inline-flex items-center gap-0.5 bg-pine-900/6 rounded-[10px] p-1 mb-4 w-full">
          {(["signin", "signup"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 h-8 rounded-[8px] text-[12.5px] font-bold transition cursor-pointer ${tab === t ? "bg-panel text-ink shadow-sm" : "text-soft hover:text-ink"}`}
            >
              {t === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
      )}

      {tab === "signin" && (
        <form onSubmit={submitSignin} className="space-y-3.5">
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.org" autoFocus required /></Field>
          <Field label="Password" hint={<button type="button" onClick={() => setTab("reset")} className="cursor-pointer font-semibold hover:underline" style={{ color: "var(--acc-deep)" }}>Forgot? Reset it</button> as unknown as string}>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" required />
          </Field>
          {err && <p className="text-[12.5px] font-semibold text-clay bg-clay/8 border border-clay/25 rounded-lg px-3 py-2">{err}</p>}
          <Btn size="lg" className="w-full" type="submit">Sign in</Btn>
          {firstRun && (
            <div className="pt-1">
              <div className="rounded-[10px] border px-3.5 py-3" style={{ borderColor: "color-mix(in srgb, var(--acc) 38%, white)", background: "color-mix(in srgb, var(--acc) 10%, white)" }}>
                <p className="text-[12.5px] font-bold" style={{ color: "var(--acc-deep)" }}>First run — admin credentials prefilled</p>
                <p className="text-[11.5px] text-soft mt-1">
                  They come from <span className="font-mono">ADMIN_EMAIL</span> / <span className="font-mono">ADMIN_PASSWORD</span> in your <span className="font-mono">docker-compose.yml</span>. Change the password after signing in.
                </p>
              </div>
            </div>
          )}
        </form>
      )}

      {tab === "signup" && (
        <form onSubmit={submitSignup} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name"><Input value={first} onChange={(e) => setFirst(e.target.value)} autoFocus required /></Field>
            <Field label="Last name"><Input value={last} onChange={(e) => setLast(e.target.value)} required /></Field>
          </div>
          <Field label="Email" hint="Confirmations and receipts arrive here."><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.org" required /></Field>
          <Field label="Password" hint="At least 6 characters. You can reset anytime."><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required /></Field>
          {err && <p className="text-[12.5px] font-semibold text-clay bg-clay/8 border border-clay/25 rounded-lg px-3 py-2">{err}</p>}
          <Btn size="lg" className="w-full" type="submit">Create account</Btn>
          <p className="text-[11px] text-faint text-center">
            Already registered? <button type="button" onClick={() => setTab("signin")} className="font-semibold cursor-pointer hover:underline" style={{ color: "var(--acc-deep)" }}>Sign in</button>
          </p>
        </form>
      )}

      {tab === "reset" && (
        <form onSubmit={submitReset} className="space-y-3.5">
          <Field label="Account email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.org" autoFocus required /></Field>
          {note && <p className="text-[12.5px] font-semibold text-pine-800 bg-pine-100 border border-pine-200 rounded-lg px-3 py-2">{note}</p>}
          {err && <p className="text-[12.5px] font-semibold text-clay bg-clay/8 border border-clay/25 rounded-lg px-3 py-2">{err}</p>}
          <Btn size="lg" className="w-full" type="submit">Send reset link</Btn>
          <p className="text-[11px] text-faint text-center">
            Remembered it? <button type="button" onClick={() => setTab("signin")} className="font-semibold cursor-pointer hover:underline" style={{ color: "var(--acc-deep)" }}>Back to sign in</button>
          </p>
        </form>
      )}
    </Modal>
  );
}
