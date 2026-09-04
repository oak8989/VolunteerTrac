import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useStore } from "../../lib/store";
import type { EventItem } from "../../lib/data";
import { eventState, fmtDay, fmtDayLong, fmtTime, fullName, hoursOf, memberEvents, memberHours, medalInfo, recordsFor, relTime, tierFor } from "../../lib/data";
import { Avatar, Bar, Btn, card, Chip, Empty, Field, fmtH, Input, LiveDot, Modal, PageHead, Ring, Rosette } from "../../components/ui";
import { IcCal, IcCheck, IcClock, IcIn, IcLock, IcMedal, IcOut, IcQr, IcScan, IcShield, IcSpark } from "../../components/icons";
import { LogoMark } from "../../components/icons";

export default function Portal({ tab, go }: { tab: string; go: (t: string) => void }) {
  const { me } = useStore();
  if (!me) return null;
  if (tab === "events") return <EventsTab />;
  if (tab === "history") return <HistoryTab />;
  if (tab === "profile") return <ProfileTab />;
  return <HomeTab go={go} />;
}

/* ---------------- shared bits ---------------- */

function useNow(secondTick = true) {
  const [, force] = useState(0);
  useEffect(() => {
    if (!secondTick) return;
    const i = window.setInterval(() => force((x) => x + 1), 1000);
    return () => window.clearInterval(i);
  }, [secondTick]);
}

function SinceTimer({ since }: { since: string }) {
  useNow();
  const ms = Math.max(0, Date.now() - new Date(since).getTime());
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return <span className="font-mono tnum">{h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`}</span>;
}

function WaiverModal({ open, onClose, onSign, viewOnly }: { open: boolean; onClose: () => void; onSign?: () => void; viewOnly?: boolean }) {
  const { db } = useStore();
  const [agree, setAgree] = useState(false);
  useEffect(() => { if (open) setAgree(false); }, [open]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={db.org.waiver.title}
      sub={viewOnly ? "Read-only copy on file" : "Please read and accept before registering"}
      w={560}
      footer={
        viewOnly ? (
          <Btn variant="line" onClick={onClose}>Close</Btn>
        ) : (
          <>
            <Btn variant="ghost" onClick={onClose}>Not now</Btn>
            <Btn disabled={!agree} onClick={() => { onSign?.(); onClose(); }}><IcShield size={14} /> Sign waiver</Btn>
          </>
        )
      }
    >
      <div className="whitespace-pre-line text-[13px] leading-relaxed text-soft bg-paper/80 border border-line rounded-[10px] p-4 max-h-[300px] overflow-y-auto">
        {db.org.waiver.body}
      </div>
      {!viewOnly && (
        <label className="flex items-start gap-2.5 mt-4 cursor-pointer group">
          <button
            type="button"
            onClick={() => setAgree(!agree)}
            className={`w-5 h-5 mt-0.5 rounded-[6px] border flex items-center justify-center transition shrink-0 cursor-pointer ${agree ? "bg-pine-800 border-pine-800 text-paper" : "border-linedark bg-white group-hover:border-pine-600"}`}
          >
            {agree && <IcCheck size={13} />}
          </button>
          <span className="text-[13px] font-medium">
            I have read and agree to the {db.org.waiver.title} on behalf of myself. <span className="font-mono text-[11px] text-faint">e-signature recorded with timestamp.</span>
          </span>
        </label>
      )}
    </Modal>
  );
}

function ScanModal({ ev, onClose }: { ev: EventItem; onClose: () => void }) {
  const { me, checkIn } = useStore();
  const [phase, setPhase] = useState<"scan" | "done">("scan");
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const checkInRef = useRef(checkIn);
  checkInRef.current = checkIn;
  useEffect(() => {
    const t = window.setTimeout(() => setPhase("done"), 2000);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    if (phase !== "done" || !me) return;
    checkInRef.current(ev.id, me.id, true);
    const t = window.setTimeout(() => onCloseRef.current(), 1100);
    return () => window.clearTimeout(t);
  }, [phase, me, ev.id]);
  return (
    <Modal open onClose={onClose} title="Walk-in check-in" sub={ev.title} w={400}>
      <div className="relative mx-auto w-[240px] h-[240px] rounded-2xl bg-pine-950 overflow-hidden flex items-center justify-center">
        {["left-3 top-3 border-l-2 border-t-2", "right-3 top-3 border-r-2 border-t-2", "left-3 bottom-3 border-l-2 border-b-2", "right-3 bottom-3 border-r-2 border-b-2"].map((c) => (
          <span key={c} className={`absolute w-7 h-7 rounded-[4px] ${c}`} style={{ borderColor: "var(--acc)" }} />
        ))}
        {phase === "scan" ? (
          <>
            <IcQr size={96} className="text-pine-700" />
            <span className="scanline absolute left-6 right-6 h-[3px] rounded-full" style={{ background: "linear-gradient(90deg, transparent, var(--acc), transparent)" }} />
            <p className="absolute bottom-4 inset-x-0 text-center text-[11px] font-mono uppercase tracking-[0.16em] text-pine-200">
              align the door QR…
            </p>
          </>
        ) : (
          <div className="anim-pop flex flex-col items-center text-paper">
            <span className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--acc)" }}>
              <IcCheck size={30} className="text-pine-950" />
            </span>
            <p className="font-display font-bold text-[17px] mt-3">You're checked in!</p>
            <p className="text-[11.5px] font-mono text-pine-200 mt-1">{new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · walk-in</p>
          </div>
        )}
      </div>
      <p className="text-center text-[12px] text-faint mt-4">
        {phase === "scan" ? "Hold your phone over the event QR code." : "Hours will log when you check out."}
      </p>
    </Modal>
  );
}

function EventDateBlock({ e }: { e: EventItem }) {
  const d = new Date(e.start);
  const live = eventState(e) === "live";
  return (
    <span className={`w-14 shrink-0 rounded-[10px] text-center py-2 border ${live ? "bg-pine-900 border-pine-900 text-paper" : "bg-white/70 border-line"}`}>
      <span className={`block text-[9.5px] font-bold uppercase tracking-wider ${live ? "text-[var(--acc)]" : "text-faint"}`}>{d.toLocaleDateString([], { weekday: "short" })}</span>
      <span className="block font-display font-bold text-[21px] leading-tight tnum">{d.getDate()}</span>
      <span className={`block text-[9.5px] font-bold uppercase ${live ? "text-pine-200" : "text-faint"}`}>{d.toLocaleDateString([], { month: "short" })}</span>
    </span>
  );
}

/* ---------------- home ---------------- */

function HomeTab({ go }: { go: (t: string) => void }) {
  const { db, me, checkIn, checkOut, signWaiver, toast } = useStore();
  const [waiverOpen, setWaiverOpen] = useState(false);
  useNow(false);
  const me_ = me!;
  const h = memberHours(db, me_.id);
  const info = medalInfo(db.org.tiers, h);
  const tiersSorted = [...db.org.tiers].sort((a, b) => a.hours - b.hours);

  const myRegs = useMemo(
    () =>
      db.attendance
        .filter((a) => a.memberId === me_.id)
        .map((a) => ({ a, e: db.events.find((e) => e.id === a.eventId) }))
        .filter((x) => x.e && eventState(x.e!) !== "past")
        .sort((x, y) => x.e!.start.localeCompare(y.e!.start)),
    [db, me_.id]
  );
  const next = myRegs[0];
  const nextLive = next && eventState(next.e!) === "live";
  const liveOpen = db.events.filter((e) => eventState(e) === "live" && (e.type === "public" || e.invitees.includes(me_.id)) && !recordsFor(db, e.id).some((r) => r.memberId === me_.id));
  const [scanEv, setScanEv] = useState<EventItem | null>(null);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  return (
    <>
      <PageHead eyebrow={`${db.org.name} · member portal`} title={`${greet}, ${me_.firstName} — ready to give an hour?`} sub={fmtDayLong(new Date().toISOString())}>
        <Btn variant="line" onClick={() => go("events")}><IcCal size={15} /> Browse events</Btn>
      </PageHead>

      {db.org.waiver.required && !me_.waiverSignedAt && (
        <div className="mb-5 flex flex-wrap items-center gap-3 bg-[color-mix(in_srgb,var(--acc)_12%,white)] border border-[color-mix(in_srgb,var(--acc)_35%,white)] rounded-xl px-4 py-3 anim-rise">
          <span className="shrink-0" style={{ color: "var(--acc-deep)" }}><IcShield size={18} /></span>
          <p className="text-[13px] flex-1 min-w-[220px]">
            <span className="font-bold">One quick step:</span> sign the {db.org.waiver.title} to unlock event registration.
          </p>
          <Btn size="sm" onClick={() => setWaiverOpen(true)}>Review & sign</Btn>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* next shift */}
        <section className={`${card} col-span-12 lg:col-span-7 p-5 anim-rise`}>
          <h2 className="font-display font-bold text-[16px] mb-4">Your next shift</h2>
          {next ? (
            <div className="flex items-start gap-4">
              <EventDateBlock e={next.e!} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-bold text-[19px] leading-tight">{next.e!.title}</p>
                  {nextLive && <Chip tone="live"><LiveDot /> happening now</Chip>}
                </div>
                <p className="font-mono text-[12px] text-soft mt-1">
                  {fmtTime(next.e!.start)}–{fmtTime(next.e!.end)} · {next.e!.location}
                </p>
                <p className="text-[12.5px] text-faint mt-1">{nextLive ? "The shift is underway — clock in when you arrive." : `Starts ${relTime(next.e!.start)}`}</p>

                <div className="mt-4 flex items-center gap-2.5 flex-wrap">
                  {nextLive && !next.a.checkIn && (
                    <Btn size="lg" onClick={() => checkIn(next.e!.id, me_.id)}><IcIn size={16} /> Check in now</Btn>
                  )}
                  {nextLive && next.a.checkIn && !next.a.checkOut && (
                    <>
                      <Chip tone="live" className="h-7 px-3 text-[12px]"><LiveDot /> on shift · <SinceTimer since={next.a.checkIn} /></Chip>
                      <Btn size="lg" variant="dark" onClick={() => checkOut(next.e!.id, me_.id)}><IcOut size={16} /> Check out</Btn>
                    </>
                  )}
                  {!nextLive && (
                    <Btn size="lg" onClick={() => go("events")}><IcCal size={15} /> Manage registration</Btn>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Empty icon={<IcCal size={22} />} title="Nothing on the calendar" sub="Browse upcoming events and grab a shift — your hours and medals are waiting." action={<Btn onClick={() => go("events")}>Find an event</Btn>} />
          )}

          {liveOpen.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-soft mb-2.5">Happening right now — walk-ins welcome</p>
              {liveOpen.map((e) => (
                <div key={e.id} className="flex items-center gap-3 bg-pine-900 text-paper rounded-[10px] px-4 py-3">
                  <LiveDot />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13.5px] truncate">{e.title}</p>
                    <p className="font-mono text-[11px] text-pine-200">{e.location}</p>
                  </div>
                  <Btn size="sm" onClick={() => setScanEv(e)}><IcScan size={13} /> Scan QR</Btn>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* medal progress */}
        <section className={`${card} col-span-12 lg:col-span-5 p-5 flex flex-col items-center anim-rise`} style={{ animationDelay: "80ms" }}>
          <h2 className="font-display font-bold text-[16px] self-start">Medal progress</h2>
          <div className="my-5">
            <Ring value={info.next ? info.progress : 1} size={168} stroke={13} tone={info.next ? info.next.color : "var(--acc)"}>
              <p className="font-display text-[32px] font-bold leading-none tnum">{h % 1 === 0 ? h : h.toFixed(1)}</p>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-faint mt-1">hours</p>
              {info.next ? (
                <p className="text-[11px] font-mono text-soft mt-1.5 tnum">{(info.next.hours - h).toFixed(1)}h to {info.next.name}</p>
              ) : (
                <p className="text-[11px] font-mono text-soft mt-1.5">top honor reached</p>
              )}
            </Ring>
          </div>
          <div className="w-full grid grid-cols-4 gap-2">
            {tiersSorted.map((t) => {
              const got = h >= t.hours;
              return (
                <div key={t.name} className={`flex flex-col items-center gap-1 rounded-[10px] border py-2.5 transition ${got ? "border-line bg-paper/80" : "border-dashed border-linedark opacity-80"}`}>
                  <Rosette color={t.color} size={26} dim={!got} />
                  <span className={`text-[9.5px] font-bold uppercase tracking-wide ${got ? "text-ink" : "text-faint"}`}>{t.name}</span>
                  <span className="text-[9px] font-mono text-faint tnum">{t.hours}h+</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* stats */}
        <section className={`${card} col-span-12 lg:col-span-7 p-5 anim-rise`} style={{ animationDelay: "140ms" }}>
          <h2 className="font-display font-bold text-[16px] mb-4">Your contribution</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "Hours logged", v: fmtH(h), icon: <IcClock size={16} /> },
              { l: "Shifts worked", v: String(memberEvents(db, me_.id)), icon: <IcCal size={16} /> },
              { l: "Medals earned", v: String(info.earned.length), icon: <IcMedal size={16} /> },
            ].map((s) => (
              <div key={s.l} className="bg-paper/80 border border-line rounded-[10px] px-4 py-3.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2" style={{ background: "color-mix(in srgb, var(--acc) 15%, white)", color: "var(--acc-deep)" }}>{s.icon}</span>
                <p className="font-display text-[22px] font-bold tnum leading-none">{s.v}</p>
                <p className="text-[10.5px] uppercase tracking-[0.09em] font-bold text-faint mt-1">{s.l}</p>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-soft mt-4 flex items-center gap-1.5">
            <span style={{ color: "var(--acc-deep)" }}><IcSpark size={14} /></span>
            That's roughly <span className="font-mono font-semibold text-ink">${Math.round(h * db.org.valuePerHour).toLocaleString()}</span> of community value since {new Date(me_.joinedAt).toLocaleDateString([], { month: "long", year: "numeric" })}.
          </p>
        </section>

        {/* upcoming registrations */}
        <section className={`${card} col-span-12 lg:col-span-5 p-5 anim-rise`} style={{ animationDelay: "200ms" }}>
          <h2 className="font-display font-bold text-[16px] mb-4">Registered</h2>
          {myRegs.length === 0 ? (
            <p className="text-[13px] text-faint">No upcoming registrations.</p>
          ) : (
            <div className="space-y-1.5">
              {myRegs.map(({ a, e }) => (
                <div key={a.id} className="flex items-center gap-3 bg-paper/70 border border-line rounded-[9px] px-3 py-2.5">
                  <span className="w-9 h-9 rounded-[8px] bg-pine-100 text-pine-800 flex items-center justify-center font-display font-bold text-[15px] tnum shrink-0">
                    {new Date(e!.start).getDate()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold truncate">{e!.title}</span>
                    <span className="block font-mono text-[11px] text-faint">{fmtDay(e!.start)} · {fmtTime(e!.start)}</span>
                  </span>
                  {a.checkIn && !a.checkOut ? <Chip tone="live"><LiveDot /> in</Chip> : <Chip tone="pine">going</Chip>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {scanEv && <ScanModal ev={scanEv} onClose={() => setScanEv(null)} />}
      <WaiverModal open={waiverOpen} onClose={() => setWaiverOpen(false)} onSign={() => { signWaiver(me_.id); toast("ok", "Waiver signed", "You can now register for any event"); }} />
    </>
  );
}

/* ---------------- events ---------------- */

function EventsTab() {
  const { db, me, register, unregister, checkIn, checkOut, signWaiver } = useStore();
  const [scanEv, setScanEv] = useState<EventItem | null>(null);
  const [waiverEv, setWaiverEv] = useState<EventItem | null>(null);
  const [viewWaiver, setViewWaiver] = useState(false);
  useNow(false);
  const me_ = me!;

  const visible = db.events
    .filter((e) => eventState(e) !== "past" && (e.type === "public" || e.invitees.includes(me_.id)))
    .sort((a, b) => a.start.localeCompare(b.start));

  const tryRegister = (e: EventItem) => {
    const needsWaiver = (e.requireWaiver || db.org.waiver.required) && !me_.waiverSignedAt;
    if (needsWaiver) return setWaiverEv(e);
    register(e.id, me_.id);
  };

  return (
    <>
      <PageHead eyebrow="Simplify member registration" title="Upcoming events" sub="Register in one tap — confirmation lands in your inbox. Live events accept walk-ins via the door QR.">
        <Btn variant="line" onClick={() => setViewWaiver(true)}><IcShield size={15} /> My waiver</Btn>
      </PageHead>

      {visible.length === 0 ? (
        <Empty icon={<IcCal size={22} />} title="No upcoming events" sub="Your organization hasn't published anything yet — check back soon or nudge an admin." />
      ) : (
        <div className="space-y-2.5">
          {visible.map((e, i) => {
            const recs = recordsFor(db, e.id);
            const mine = recs.find((r) => r.memberId === me_.id);
            const live = eventState(e) === "live";
            const full = recs.length >= e.capacity;
            const needsWaiver = (e.requireWaiver || db.org.waiver.required) && !me_.waiverSignedAt;
            return (
              <div key={e.id} className={`anim-rise flex flex-wrap items-center gap-4 rounded-xl border bg-panel px-4 py-3.5 transition-all ${live ? "border-pine-700 shadow-[0_6px_24px_-12px_rgba(17,49,41,.5)]" : "border-line hover:border-[var(--acc)]"}`} style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                <EventDateBlock e={e} />
                <div className="min-w-0 flex-1 basis-52">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-display font-bold text-[15px]">{e.title}</p>
                    {live && <Chip tone="live"><LiveDot /> live</Chip>}
                    {e.type === "private" && <Chip tone="ink">group invite</Chip>}
                    {(e.requireWaiver || db.org.waiver.required) && <Chip tone="line"><IcShield size={10} /> waiver</Chip>}
                  </div>
                  <p className="font-mono text-[12px] text-soft mt-1">{fmtTime(e.start)}–{fmtTime(e.end)} · {e.location}</p>
                  <div className="flex items-center gap-2.5 mt-2 max-w-[300px]">
                    <Bar value={recs.length / e.capacity} tone={full ? "var(--color-clay)" : undefined} className="flex-1" />
                    <span className="font-mono text-[11px] text-faint tnum">{recs.length}/{e.capacity}{full ? " · full" : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {mine ? (
                    mine.checkIn && !mine.checkOut ? (
                      <>
                        <Chip tone="live" className="h-7 px-3"><LiveDot /> <SinceTimer since={mine.checkIn} /></Chip>
                        <Btn variant="dark" onClick={() => checkOut(e.id, me_.id)}><IcOut size={14} /> Check out</Btn>
                      </>
                    ) : mine.checkIn && mine.checkOut ? (
                      <Chip tone="pine">done · {fmtH(hoursOf(mine))}</Chip>
                    ) : live ? (
                      <Btn onClick={() => checkIn(e.id, me_.id)}><IcIn size={14} /> Check in</Btn>
                    ) : (
                      <>
                        <Chip tone="pine"><IcCheck size={11} /> registered</Chip>
                        <Btn variant="ghost" size="sm" onClick={() => unregister(e.id, me_.id)}>Cancel</Btn>
                      </>
                    )
                  ) : live ? (
                    <Btn variant="dark" onClick={() => setScanEv(e)}><IcScan size={14} /> Scan walk-in QR</Btn>
                  ) : (
                    <Btn onClick={() => tryRegister(e)} disabled={full} title={needsWaiver ? "You'll be asked to sign the waiver first" : undefined}>
                      {full ? "Event full" : needsWaiver ? "Sign waiver & register" : "Register"}
                    </Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {scanEv && <ScanModal ev={scanEv} onClose={() => setScanEv(null)} />}
      <WaiverModal
        open={!!waiverEv}
        onClose={() => setWaiverEv(null)}
        onSign={() => {
          if (!waiverEv) return;
          signWaiver(me_.id);
          register(waiverEv.id, me_.id);
        }}
      />
      <WaiverModal open={viewWaiver} onClose={() => setViewWaiver(false)} viewOnly />
    </>
  );
}

/* ---------------- history ---------------- */

function HistoryTab() {
  const { db, me } = useStore();
  const me_ = me!;
  const rows = db.attendance
    .filter((a) => a.memberId === me_.id && a.checkIn)
    .map((a) => ({ a, e: db.events.find((e) => e.id === a.eventId) }))
    .filter((x) => x.e)
    .sort((x, y) => y.e!.start.localeCompare(x.e!.start));
  const total = rows.reduce((s, x) => s + hoursOf(x.a), 0);

  return (
    <>
      <PageHead eyebrow="Track your impact" title="My hours" sub="Every shift you've clocked — the same ledger your admins see." />
      {rows.length === 0 ? (
        <Empty icon={<IcClock size={22} />} title="No hours yet" sub="Check in at your first event and your personal ledger starts here." />
      ) : (
        <div className={`${card} overflow-hidden anim-rise`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-[0.09em] text-faint border-b border-line bg-paper/60">
                  <th className="font-bold px-4 py-3">Event</th>
                  <th className="font-bold px-3 py-3">Date</th>
                  <th className="font-bold px-3 py-3">In</th>
                  <th className="font-bold px-3 py-3">Out</th>
                  <th className="font-bold px-3 py-3 text-right">Hours</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ a, e }) => (
                  <tr key={a.id} className="border-b border-line last:border-0 hover:bg-pine-900/3 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold block">{e!.title}</span>
                      {a.walkIn && <span className="text-[10px] font-mono uppercase tracking-wide text-pine-700">walk-in · QR</span>}
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px] text-soft">{fmtDay(e!.start)}</td>
                    <td className="px-3 py-3 font-mono text-[12px] text-soft tnum">{a.checkIn ? fmtTime(a.checkIn) : "—"}</td>
                    <td className="px-3 py-3 font-mono text-[12px] text-soft tnum">{a.checkOut ? fmtTime(a.checkOut) : <span className="text-clay font-bold">open</span>}</td>
                    <td className="px-3 py-3 font-mono font-bold text-[13px] text-right tnum">{fmtH(hoursOf(a))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-pine-900 text-paper">
                  <td colSpan={4} className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-pine-200">Total contribution</td>
                  <td className="px-3 py-3 font-mono font-bold text-right tnum text-[15px]" style={{ color: "var(--acc)" }}>{fmtH(Math.round(total * 100) / 100)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- profile ---------------- */

function ProfileTab() {
  const { db, me, updateMember, signWaiver, toast } = useStore();
  const me_ = me!;
  const [phone, setPhone] = useState(me_.phone);
  const [title, setTitle] = useState(me_.title);
  const [pw, setPw] = useState("");
  const [waiverOpen, setWaiverOpen] = useState(false);
  const h = memberHours(db, me_.id);
  const tier = tierFor(db.org.tiers, h);

  return (
    <>
      <PageHead eyebrow="Your space" title="Profile & membership" sub="Keep your contact details fresh — it's how confirmation emails find you." />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5 space-y-4">
          {/* identity */}
          <section className={`${card} p-5 anim-rise`}>
            <div className="flex items-center gap-4">
              <Avatar name={fullName(me_)} color={me_.color} size={58} />
              <div className="min-w-0">
                <p className="font-display font-bold text-[18px] leading-tight">{fullName(me_)}</p>
                <p className="text-[12.5px] text-soft font-mono truncate">{me_.email}</p>
                <p className="text-[11.5px] text-faint mt-1">
                  {me_.groups.join(" · ") || "No groups"} · member since {new Date(me_.joinedAt).toLocaleDateString([], { month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 mt-4 bg-paper/80 border border-line rounded-[10px] px-3.5 py-2.5">
              {tier ? <Rosette color={tier.color} size={26} /> : <IcMedal size={24} className="text-faint" />}
              <div className="flex-1">
                <p className="text-[13px] font-bold">{tier ? `${tier.name} medal` : "No medal yet"}</p>
                <p className="text-[11.5px] text-soft font-mono tnum">{fmtH(h)} career hours</p>
              </div>
            </div>
          </section>

          {/* membership card */}
          <section className="anim-rise relative overflow-hidden rounded-2xl bg-pine-950 text-paper p-5" style={{ animationDelay: "80ms" }}>
            <div className="absolute inset-0 opacity-50" style={{ background: "radial-gradient(400px 200px at 90% -20%, color-mix(in srgb, var(--acc) 30%, transparent), transparent 60%)" }} />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <LogoMark variant={db.org.logoMark} size={30} bg="rgba(255,255,255,0.08)" />
                  <p className="font-display font-bold text-[13.5px]">{db.org.name}</p>
                </div>
                <p className="mt-5 font-display font-bold text-[19px]">{fullName(me_)}</p>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-pine-200 mt-1">member · {me_.id.replace(/[^a-z0-9]/gi, "").slice(0, 8)}</p>
              </div>
              <div className="bg-white rounded-[10px] p-1.5">
                <QRCodeSVG value={`VOLUNTEERTRAC:member:${me_.id}`} size={84} fgColor="#113129" bgColor="#ffffff" />
              </div>
            </div>
            <p className="relative font-mono text-[10px] text-pine-300 mt-4">Scan at the front desk to verify membership</p>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-7 space-y-4">
          {/* edit */}
          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "60ms" }}>
            <h2 className="font-display font-bold text-[16px] mb-4">Contact details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email" hint="Confirmation & reset emails go here.">
                <Input value={me_.email} disabled className="opacity-70" />
              </Field>
              <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
              <Field label="Display title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Trail Lead" /></Field>
              <div className="flex items-end">
                <Btn onClick={() => { updateMember(me_.id, { phone, title }); toast("ok", "Profile updated"); }}>Save profile</Btn>
              </div>
            </div>
          </section>

          {/* waiver status */}
          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "120ms" }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display font-bold text-[16px] flex items-center gap-2"><IcShield size={17} className="text-pine-700" /> {db.org.waiver.title}</h2>
                {me_.waiverSignedAt ? (
                  <p className="text-[12.5px] text-soft mt-1">Signed {new Date(me_.waiverSignedAt).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })} · on file with {db.org.name}</p>
                ) : (
                  <p className="text-[12.5px] text-clay font-semibold mt-1">Not signed yet — required for event registration.</p>
                )}
              </div>
              {me_.waiverSignedAt ? (
                <Btn variant="line" onClick={() => setWaiverOpen(true)}>Read copy</Btn>
              ) : (
                <Btn onClick={() => setWaiverOpen(true)}>Review & sign</Btn>
              )}
            </div>
          </section>

          {/* security */}
          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "180ms" }}>
            <h2 className="font-display font-bold text-[16px] mb-4 flex items-center gap-2"><IcLock size={16} className="text-pine-700" /> Password</h2>
            <div className="flex flex-wrap gap-2.5 items-end">
              <Field label="New password" className="flex-1 min-w-[200px]">
                <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
              </Field>
              <Btn variant="line" disabled={pw.length < 6} onClick={() => { updateMember(me_.id, { password: pw }); setPw(""); toast("ok", "Password updated", "Use it next time you sign in"); }}>
                Update password
              </Btn>
              <Btn variant="ghost" onClick={() => toast("ok", "Reset link sent", `Check ${me_.email} — link expires in 30 min (simulated)`)}>
                Email me a reset link
              </Btn>
            </div>
            <p className="text-[11.5px] text-faint mt-3">Demo note: authentication is simulated — any account card on the sign-in screen works without a password.</p>
          </section>
        </div>
      </div>

      <WaiverModal
        open={waiverOpen}
        onClose={() => setWaiverOpen(false)}
        viewOnly={!!me_.waiverSignedAt}
        onSign={me_.waiverSignedAt ? undefined : () => { signWaiver(me_.id); toast("ok", "Waiver signed", "Stored on your profile"); }}
      />
    </>
  );
}
