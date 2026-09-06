import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useStore } from "../../lib/store";
import type { Attendance, EventItem } from "../../lib/data";
import { at, downloadText, eventHours, eventRevenue, eventState, fmtDay, fmtDayLong, fmtMoney, fmtRange, fmtTime, fromLocal, fullName, GROUPS, hoursOf, relTime, toCSV, toLocal, uid } from "../../lib/data";
import { Avatar, Btn, card, Chip, Confirm, Empty, Field, Input, LiveDot, Modal, PageHead, Seg, Select, Textarea, fmtH } from "../../components/ui";
import { IcBack, IcCal, IcCheck, IcChevR, IcDown, IcIn, IcOut, IcPencil, IcPin, IcPlus, IcQr, IcRepeat, IcSearch, IcShield, IcTrash, IcUsers, IcX } from "../../components/icons";

type Filter = "all" | "upcoming" | "live" | "past" | "recurring";

export default function EventsView() {
  const { db, removeEvent, checkIn, checkOut } = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const events = useMemo(() => {
    const now = Date.now();
    let list = [...db.events];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(s) || e.location.toLowerCase().includes(s));
    }
    if (filter === "upcoming") list = list.filter((e) => new Date(e.start).getTime() > now);
    if (filter === "live") list = list.filter((e) => eventState(e) === "live");
    if (filter === "past") list = list.filter((e) => new Date(e.end).getTime() < now);
    if (filter === "recurring") list = list.filter((e) => e.seriesId);
    return list.sort((a, b) => {
      const pa = new Date(a.end).getTime() < now ? 1 : 0;
      const pb = new Date(b.end).getTime() < now ? 1 : 0;
      if (pa !== pb) return pa - pb;
      return pa === 1 ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start);
    });
  }, [db.events, q, filter]);

  const selEvent = sel ? db.events.find((e) => e.id === sel) || null : null;

  if (selEvent) {
    return (
      <EventDetail
        ev={selEvent}
        back={() => setSel(null)}
        onDelete={() => setConfirmDel(selEvent.id)}
        onCheckIn={(m) => checkIn(selEvent.id, m)}
        onCheckOut={(m) => checkOut(selEvent.id, m)}
      />
    );
  }

  return (
    <>
      <PageHead eyebrow="Plan memorable events" title="Events" sub="Public outreach, private group work, and recurring series — each with its own attendance ledger.">
        <Btn onClick={() => setCreating(true)}><IcPlus size={15} /> New event</Btn>
      </PageHead>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Seg<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "All" },
            { id: "upcoming", label: "Upcoming" },
            { id: "live", label: "Live" },
            { id: "past", label: "Past" },
            { id: "recurring", label: "Recurring" },
          ]}
        />
        <div className="relative ml-auto w-full sm:w-64">
          <IcSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <Input placeholder="Search title or location…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      {events.length === 0 ? (
        <Empty icon={<IcCal size={22} />} title="No events match" sub="Try a different filter, or publish something new — your volunteers are waiting." action={<Btn onClick={() => setCreating(true)}><IcPlus size={15} /> New event</Btn>} />
      ) : (
        <div className="space-y-2.5">
          {events.map((e, i) => {
            const regs = db.attendance.filter((a) => a.eventId === e.id);
            const state = eventState(e);
            const d = new Date(e.start);
            return (
              <button
                key={e.id}
                onClick={() => setSel(e.id)}
                className={`anim-rise group w-full text-left flex items-center gap-4 rounded-xl border border-line bg-panel px-4 py-3.5 transition-all duration-150 hover:border-[var(--acc)] hover:shadow-[0_6px_22px_-10px_rgba(20,40,30,.3)] hover:-translate-y-px cursor-pointer ${state === "past" ? "opacity-75 hover:opacity-100" : ""}`}
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
              >
                <span className={`w-14 shrink-0 rounded-[10px] text-center py-2 border ${state === "live" ? "bg-pine-900 border-pine-900 text-paper" : "bg-white/70 border-line"}`}>
                  <span className={`block text-[9.5px] font-bold uppercase tracking-wider ${state === "live" ? "text-[var(--acc)]" : "text-faint"}`}>
                    {d.toLocaleDateString([], { weekday: "short" })}
                  </span>
                  <span className="block font-display font-bold text-[21px] leading-tight tnum">{d.getDate()}</span>
                  <span className={`block text-[9.5px] font-bold uppercase ${state === "live" ? "text-pine-200" : "text-faint"}`}>
                    {d.toLocaleDateString([], { month: "short" })}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-[15px] group-hover:text-pine-800 transition-colors">{e.title}</span>
                    {state === "live" && <Chip tone="live"><LiveDot /> live</Chip>}
                    {e.type === "private" ? <Chip tone="ink">Private</Chip> : <Chip tone="pine">Public</Chip>}
                    {e.seriesId && <Chip tone="acc"><IcRepeat size={10} /> series</Chip>}
                    {e.requireWaiver && <Chip tone="line"><IcShield size={10} /> waiver</Chip>}
                    {e.fee > 0 && <Chip tone="gold">{fmtMoney(e.fee)}</Chip>}
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] text-soft font-mono mt-1">
                    {fmtTime(e.start)}–{fmtTime(e.end)} <span className="text-linedark">·</span> <IcPin size={11} className="text-faint" /> {e.location}
                  </span>
                </span>
                <span className="hidden sm:block w-32 shrink-0">
                  <span className="flex justify-between text-[11px] font-mono text-soft mb-1">
                    <span className="tnum">{regs.length}/{e.capacity}</span>
                    <span className="tnum">{fmtH(eventHours(db, e.id))}</span>
                  </span>
                  <span className="block h-1.5 rounded-full bg-line overflow-hidden">
                    <span className="block h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (regs.length / e.capacity) * 100)}%`, background: regs.length >= e.capacity ? "var(--color-clay)" : "var(--acc)" }} />
                  </span>
                </span>
                <IcChevR size={16} className="text-faint group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      <CreateEventModal open={creating} onClose={() => setCreating(false)} />
      <Confirm
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onYes={() => confirmDel && removeEvent(confirmDel)}
        title="Remove this event?"
        body="The event and every registration, check-in and logged hour attached to it will be permanently deleted."
        yesLabel="Remove event"
      />
    </>
  );
}

/* ================= detail ================= */

function EventDetail({
  ev, back, onDelete, onCheckIn, onCheckOut,
}: { ev: EventItem; back: () => void; onDelete: () => void; onCheckIn: (memberId: string) => void; onCheckOut: (memberId: string) => void }) {
  const { db, removeAttendance, saveTimes, register, checkIn, markPaid } = useStore();
  const [qr, setQr] = useState(false);
  const [walkModal, setWalkModal] = useState(false);
  const [walkSel, setWalkSel] = useState("");
  const [editRec, setEditRec] = useState<Attendance | null>(null);
  const [addSel, setAddSel] = useState("");

  const recs = db.attendance.filter((a) => a.eventId === ev.id).sort((a, b) => {
    const ma = db.members.find((m) => m.id === a.memberId);
    const mb = db.members.find((m) => m.id === b.memberId);
    return fullName(ma!).localeCompare(fullName(mb!));
  });
  const notReg = db.members.filter((m) => m.active && !recs.some((r) => r.memberId === m.id));
  const state = eventState(ev);
  const checkedIn = recs.filter((r) => r.checkIn && !r.checkOut).length;
  const done = recs.filter((r) => r.checkIn && r.checkOut).length;
  const walkIns = recs.filter((r) => r.walkIn).length;
  const hrs = eventHours(db, ev.id);

  const exportCSV = () => {
    const rows: (string | number)[][] = [["Member", "Email", "Status", "Walk-in", "Check-in", "Check-out", "Hours", "Payment", "Receipt"]];
    recs.forEach((r) => {
      const m = db.members.find((x) => x.id === r.memberId)!;
      rows.push([
        fullName(m), m.email,
        r.checkIn && r.checkOut ? "Completed" : r.checkIn ? "Checked in" : state === "past" ? "No show" : "Registered",
        r.walkIn ? "yes" : "no",
        r.checkIn ? new Date(r.checkIn).toLocaleString() : "",
        r.checkOut ? new Date(r.checkOut).toLocaleString() : "",
        hoursOf(r),
        r.payment ? r.payment.amount.toFixed(2) : ev.fee > 0 ? "due" : "free",
        r.payment ? r.payment.receipt : "",
      ]);
    });
    downloadText(`${ev.title.replace(/\s+/g, "-").toLowerCase()}-attendance.csv`, toCSV(rows));
  };

  return (
    <>
      <button onClick={back} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-soft hover:text-ink transition mb-4 cursor-pointer">
        <IcBack size={15} /> All events
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-5 anim-rise">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-[26px] font-bold tracking-tight leading-tight">{ev.title}</h1>
            {state === "live" && <Chip tone="live"><LiveDot /> live now</Chip>}
            {ev.type === "private" ? <Chip tone="ink">Private</Chip> : <Chip tone="pine">Public</Chip>}
            {ev.seriesId && <Chip tone="acc"><IcRepeat size={10} /> recurring series</Chip>}
          </div>
          <p className="text-[13px] text-soft font-mono mt-1.5 flex items-center gap-1.5 flex-wrap">
            {fmtDayLong(ev.start)} · {fmtTime(ev.start)}–{fmtTime(ev.end)}
            <span className="text-linedark">·</span>
            <IcPin size={12} className="text-faint" /> {ev.location}
          </p>
          {ev.description && <p className="text-[13.5px] text-soft mt-2 max-w-[600px]">{ev.description}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Btn variant="line" onClick={() => setQr(true)}><IcQr size={15} /> Walk-in QR</Btn>
          <Btn variant="line" onClick={exportCSV}><IcDown size={15} /> Export CSV</Btn>
          <Btn variant="ghost" className="text-clay hover:bg-clay/10" onClick={onDelete}><IcTrash size={15} /></Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {[
          { l: "Registered", v: `${recs.length}/${ev.capacity}` },
          { l: "Checked in", v: String(checkedIn), live: checkedIn > 0 },
          { l: "Completed", v: String(done) },
          { l: "Hours logged", v: fmtH(hrs) },
          { l: ev.fee > 0 ? `Revenue · ${fmtMoney(ev.fee)}/person` : "Revenue", v: fmtMoney(eventRevenue(db, ev.id)), accent: true },
        ].map((s) => (
          <div key={s.l} className={`${card} px-4 py-3`}>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-soft flex items-center gap-1.5">
              {s.live && <LiveDot />} {s.l}
            </p>
            <p className={`font-display text-[22px] font-bold tnum mt-0.5 ${s.accent ? "" : ""}`} style={s.accent ? { color: "var(--acc-deep)" } : undefined}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className={`${card} overflow-hidden anim-rise`} style={{ animationDelay: "80ms" }}>
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-line bg-paper/60">
          <h2 className="font-display font-bold text-[15px] mr-auto">Attendance ledger</h2>
          <Select value={addSel} onChange={(e) => setAddSel(e.target.value)} className="w-52 text-xs" style={{ height: 32 }}>
            <option value="">Register a member…</option>
            {notReg.map((m) => <option key={m.id} value={m.id}>{fullName(m)}</option>)}
          </Select>
          <Btn size="sm" variant="soft" disabled={!addSel} onClick={() => { register(ev.id, addSel); setAddSel(""); }}>
            <IcPlus size={13} /> Add
          </Btn>
          <Btn size="sm" variant="dark" onClick={() => { setWalkSel(notReg[0]?.id || ""); setWalkModal(true); }}>
            <IcQr size={13} /> Record walk-in
          </Btn>
        </div>

        {recs.length === 0 ? (
          <div className="p-8">
            <Empty icon={<IcUsers size={22} />} title="Nobody yet" sub="Register a member above, share the walk-in QR, or wait for portal sign-ups." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-[0.09em] text-faint border-b border-line">
                  <th className="font-bold px-4 py-2.5">Member</th>
                  <th className="font-bold px-3 py-2.5">Status</th>
                  <th className="font-bold px-3 py-2.5">Check-in</th>
                  <th className="font-bold px-3 py-2.5">Check-out</th>
                  <th className="font-bold px-3 py-2.5 text-right">Hours</th>
                  <th className="font-bold px-3 py-2.5">Payment</th>
                  <th className="font-bold px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recs.map((r) => {
                  const m = db.members.find((x) => x.id === r.memberId);
                  if (!m) return null;
                  const inNow = !!r.checkIn && !r.checkOut;
                  return (
                    <tr key={r.id} className="border-b border-line last:border-0 hover:bg-pine-900/3 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2.5">
                          <Avatar name={fullName(m)} color={m.color} size={30} />
                          <span className="min-w-0">
                            <span className="block font-semibold truncate">{fullName(m)}</span>
                            {r.walkIn && <span className="text-[10px] font-mono text-pine-700 uppercase tracking-wide">walk-in · QR</span>}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {inNow ? (
                          <Chip tone="live"><LiveDot /> in · <LiveTimer since={r.checkIn!} /></Chip>
                        ) : r.checkIn && r.checkOut ? (
                          <Chip tone="pine">completed</Chip>
                        ) : state === "past" ? (
                          <Chip tone="warn">no-show</Chip>
                        ) : (
                          <Chip tone="line">registered</Chip>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px] tnum text-soft">{r.checkIn ? fmtTime(r.checkIn) : "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-[12px] tnum text-soft">{r.checkOut ? fmtTime(r.checkOut) : "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-[12.5px] font-semibold tnum text-right">{fmtH(hoursOf(r))}</td>
                      <td className="px-3 py-2.5">
                        {r.payment ? (
                          <span title={`Receipt ${r.payment.receipt} · ${new Date(r.payment.at).toLocaleDateString()}`}>
                            <Chip tone="pine"><IcCheck size={10} /> {fmtMoney(r.payment.amount)}</Chip>
                          </span>
                        ) : ev.fee > 0 ? (
                          <span className="flex items-center gap-1.5">
                            <Chip tone="warn">due {fmtMoney(ev.fee)}</Chip>
                            <button
                              onClick={() => markPaid(r.id, ev.fee)}
                              className="h-6 px-2 rounded-md text-[10px] font-bold uppercase tracking-wide border border-line text-soft hover:border-pine-600 hover:text-pine-800 transition cursor-pointer"
                            >
                              Mark paid
                            </button>
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-faint">free</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="flex justify-end gap-1">
                          {!r.checkIn && (
                            <Btn size="sm" variant="soft" onClick={() => onCheckIn(m.id)}><IcIn size={12} /> In</Btn>
                          )}
                          {inNow && (
                            <Btn size="sm" variant="dark" onClick={() => onCheckOut(m.id)}><IcOut size={12} /> Out</Btn>
                          )}
                          <button title="Edit times" onClick={() => setEditRec(r)} className="p-1.5 rounded-lg text-soft hover:bg-pine-900/6 hover:text-ink transition cursor-pointer"><IcPencil size={14} /></button>
                          <button title="Remove from event" onClick={() => removeAttendance(r.id)} className="p-1.5 rounded-lg text-soft hover:bg-clay/10 hover:text-clay transition cursor-pointer"><IcX size={14} /></button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {walkIns > 0 && (
          <p className="px-4 py-2.5 text-[11.5px] font-mono text-soft border-t border-line bg-paper/50">
            {walkIns} walk-in{walkIns > 1 ? "s" : ""} recorded via QR this event
          </p>
        )}
      </div>

      {/* QR modal */}
      <Modal open={qr} onClose={() => setQr(false)} title="Walk-in check-in QR" sub="Post this at the door — members scan it from their portal to check in instantly." w={420}>
        <div className="flex flex-col items-center py-2">
          <div className="p-4 bg-white rounded-xl border border-line shadow-sm anim-floaty">
            <QRCodeSVG value={`VOLUNTEERTRAC:checkin:${ev.id}`} size={196} fgColor="#113129" bgColor="#ffffff" level="M" />
          </div>
          <p className="font-mono text-[11px] text-soft mt-4 uppercase tracking-wider">{fmtRange(ev)}</p>
          <p className="text-[12px] text-faint mt-2 text-center max-w-[300px]">
            Scanning creates a walk-in attendance record and clocks the member in with one tap.
          </p>
        </div>
      </Modal>

      {/* manual walk-in */}
      <Modal
        open={walkModal}
        onClose={() => setWalkModal(false)}
        title="Record a walk-in"
        sub="For members who arrived without registering — same as scanning the door QR."
        w={420}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setWalkModal(false)}>Cancel</Btn>
            <Btn disabled={!walkSel} onClick={() => { checkIn(ev.id, walkSel, true); setWalkModal(false); }}><IcQr size={14} /> Check in walk-in</Btn>
          </>
        }
      >
        <Field label="Member">
          <Select value={walkSel} onChange={(e) => setWalkSel(e.target.value)}>
            {notReg.length === 0 && <option value="">Everyone is already on the list</option>}
            {notReg.map((m) => <option key={m.id} value={m.id}>{fullName(m)}</option>)}
          </Select>
        </Field>
      </Modal>

      {/* edit times */}
      {editRec && (
        <EditTimesModal
          rec={editRec}
          memberName={fullName(db.members.find((m) => m.id === editRec.memberId)!)}
          onClose={() => setEditRec(null)}
          onSave={(ci, co) => { saveTimes(editRec.id, ci, co); setEditRec(null); }}
        />
      )}
    </>
  );
}

function LiveTimer({ since }: { since: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const i = window.setInterval(() => force((x) => x + 1), 1000);
    return () => window.clearInterval(i);
  }, []);
  const ms = Math.max(0, Date.now() - new Date(since).getTime());
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return <span className="tnum">{h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`}</span>;
}

function EditTimesModal({
  rec, memberName, onClose, onSave,
}: { rec: Attendance; memberName: string; onClose: () => void; onSave: (ci: string | null, co: string | null) => void }) {
  const [ci, setCi] = useState(rec.checkIn ? toLocal(rec.checkIn) : "");
  const [co, setCo] = useState(rec.checkOut ? toLocal(rec.checkOut) : "");
  return (
    <Modal
      open
      onClose={onClose}
      title="Correct attendance"
      sub={`${memberName} — forgot to check in or out? Fix the ledger here.`}
      w={430}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => onSave(fromLocal(ci), fromLocal(co))}>Save times</Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Check-in"><Input type="datetime-local" value={ci} onChange={(e) => setCi(e.target.value)} /></Field>
        <Field label="Check-out" hint="Leave a field empty to clear it."><Input type="datetime-local" value={co} onChange={(e) => setCo(e.target.value)} /></Field>
        {fromLocal(ci) && fromLocal(co) && (
          <p className="text-[12.5px] font-mono text-pine-800 bg-pine-100/70 rounded-lg px-3 py-2">
            = {fmtH(Math.round(((new Date(fromLocal(co)!).getTime() - new Date(fromLocal(ci)!).getTime()) / 3600000) * 100) / 100)} credited
          </p>
        )}
      </div>
    </Modal>
  );
}

/* ================= create ================= */

function CreateEventModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, addEvents } = useStore();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState("09:00");
  const [dur, setDur] = useState(4);
  const [capacity, setCapacity] = useState(20);
  const [type, setType] = useState<"public" | "private">("public");
  const [groups, setGroups] = useState<string[]>([]);
  const [recur, setRecur] = useState<"none" | "weekly" | "monthly">("none");
  const [count, setCount] = useState(4);
  const [waiver, setWaiver] = useState(false);
  const [fee, setFee] = useState(0);
  const [err, setErr] = useState("");
  const paymentsOn = db.org.payments.enabled;

  const submit = () => {
    if (!title.trim()) return setErr("Give the event a title.");
    if (!date || !time) return setErr("Pick a date and start time.");
    if (capacity < 1) return setErr("Capacity must be at least 1.");
    if (type === "private" && groups.length === 0) return setErr("Private events need at least one invited group.");
    setErr("");

    const [hh, mm] = time.split(":").map(Number);
    const seriesId = recur !== "none" ? uid() : null;
    const n = recur === "none" ? 1 : count;
    const evts: EventItem[] = [];
    for (let i = 0; i < n; i++) {
      const s = new Date(`${date}T00:00:00`);
      s.setHours(hh, mm, 0, 0);
      if (recur === "weekly") s.setDate(s.getDate() + i * 7);
      if (recur === "monthly") s.setMonth(s.getMonth() + i);
      const e = new Date(s.getTime() + dur * 3600000);
      const invitees = type === "private"
        ? db.members.filter((m) => m.active && m.groups.some((g) => groups.includes(g))).map((m) => m.id)
        : [];
      evts.push({
        id: uid(), seriesId, title: title.trim(), description: desc.trim(),
        location: location.trim() || "TBD", start: s.toISOString(), end: e.toISOString(),
        capacity, type, invitees, requireWaiver: waiver, fee: paymentsOn ? Math.max(0, fee) : 0,
        createdAt: new Date().toISOString(),
      });
    }
    addEvents(evts);
    setTitle(""); setDesc(""); setLocation(""); setGroups([]); setRecur("none"); setWaiver(false); setFee(0);
    onClose();
  };

  const toggleGroup = (g: string) => setGroups((gs) => (gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publish an event"
      sub="Public events appear in every member's portal. Private events only appear to invited groups."
      w={620}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={submit}><IcPlus size={14} /> {recur === "none" ? "Publish event" : `Publish ${count} dates`}</Btn>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Title" className="sm:col-span-2"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="River Cleanup Day" autoFocus /></Field>
        <Field label="Description" className="sm:col-span-2"><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What should volunteers expect?" /></Field>
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Start time"><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        <Field label="Duration (hours)"><Input type="number" min={0.5} step={0.5} value={dur} onChange={(e) => setDur(Number(e.target.value))} /></Field>
        <Field label="Capacity"><Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /></Field>
        <Field
          label="Fee per person ($)"
          hint={paymentsOn ? "0 = free event. Members pay at registration; receipts are emailed." : "Payments are disabled — enable them in Settings first."}
          className="sm:col-span-2"
        >
          <Input type="number" min={0} step={0.5} value={fee} disabled={!paymentsOn} onChange={(e) => setFee(Number(e.target.value))} className={!paymentsOn ? "opacity-55" : ""} />
        </Field>
        <Field label="Location" className="sm:col-span-2"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Riverbend Park, East Gate" /></Field>

        <div className="sm:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-soft mb-1.5">Visibility</p>
          <div className="flex gap-2">
            {(["public", "private"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)}
                className={`flex-1 rounded-[10px] border px-3 py-2.5 text-left transition cursor-pointer ${type === t ? "border-[var(--acc)] bg-[color-mix(in_srgb,var(--acc)_8%,white)]" : "border-linedark bg-white/60 hover:border-faint"}`}
              >
                <span className="block text-[13px] font-bold capitalize">{t}</span>
                <span className="block text-[11px] text-soft mt-0.5">{t === "public" ? "Open to all members" : "Invite specific groups"}</span>
              </button>
            ))}
          </div>
          {type === "private" && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {GROUPS.map((g) => (
                <button key={g} onClick={() => toggleGroup(g)}
                  className={`h-7.5 px-3 rounded-full text-[12px] font-semibold border transition cursor-pointer ${groups.includes(g) ? "bg-pine-900 text-paper border-pine-900" : "border-linedark text-soft hover:border-pine-600"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>

        <Field label="Recurrence">
          <Select value={recur} onChange={(e) => setRecur(e.target.value as typeof recur)}>
            <option value="none">One-time</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        </Field>
        {recur !== "none" ? (
          <Field label="Occurrences" hint={`${recur === "weekly" ? "Every week" : "Same day each month"}, ${count} dates total`}>
            <Input type="number" min={2} max={12} value={count} onChange={(e) => setCount(Math.max(2, Math.min(12, Number(e.target.value))))} />
          </Field>
        ) : (
          <Field label="Waiver">
            <button onClick={() => setWaiver(!waiver)} className={`w-full h-9.5 px-3 rounded-[9px] border text-[13px] font-semibold inline-flex items-center gap-2 transition cursor-pointer ${waiver ? "border-pine-700 bg-pine-100 text-pine-800" : "border-linedark bg-white/60 text-soft"}`}>
              <IcShield size={14} /> {waiver ? "Waiver required" : "No waiver needed"}
            </button>
          </Field>
        )}
        {recur !== "none" && (
          <Field label="Waiver">
            <button onClick={() => setWaiver(!waiver)} className={`w-full h-9.5 px-3 rounded-[9px] border text-[13px] font-semibold inline-flex items-center gap-2 transition cursor-pointer ${waiver ? "border-pine-700 bg-pine-100 text-pine-800" : "border-linedark bg-white/60 text-soft"}`}>
              <IcShield size={14} /> {waiver ? "Waiver required" : "No waiver needed"}
            </button>
          </Field>
        )}

        {err && <p className="sm:col-span-2 text-[12.5px] font-semibold text-clay bg-clay/8 border border-clay/25 rounded-lg px-3 py-2">{err}</p>}
      </div>
    </Modal>
  );
}
