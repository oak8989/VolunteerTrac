import { useStore } from "../../lib/store";
import type { Activity } from "../../lib/data";
import { eventState, fmtTime, fullName, memberEvents, memberHours, monthSeries, recordsFor, relTime, tierFor, totalHours } from "../../lib/data";
import { Avatar, Bar, Btn, card, Chip, Clock, fmtH, LiveDot, PageHead, Rosette, Spark, useCountUp } from "../../components/ui";
import { IcCal, IcCard, IcChevR, IcIn, IcInfo, IcMail, IcMedal, IcPencil, IcQr, IcRefund } from "../../components/icons";

export default function DashboardView({ go }: { go: (tab: string) => void }) {
  const { db, me } = useStore();
  const series = monthSeries(db, 8);
  const th = totalHours(db);
  const hoursAnim = useCountUp(th);
  const weekMs = 7 * 86400000;
  const weekHours = Math.round(db.attendance.reduce((s, a) => {
    if (!a.checkIn) return s;
    return Date.now() - new Date(a.checkIn).getTime() < weekMs ? s + (a.checkOut ? Math.max(0, (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 3600000) : 0) : s;
  }, 0) * 10) / 10;

  const activeVols = db.members.filter((m) => m.active && m.role === "member");
  const upcoming = db.events.filter((e) => eventState(e) !== "past").sort((a, b) => a.start.localeCompare(b.start));
  const signedInNow = db.attendance.filter((a) => a.checkIn && !a.checkOut);
  const medaled = db.members.filter((m) => tierFor(db.org.tiers, memberHours(db, m.id))).length;
  const top = [...db.members].sort((a, b) => memberHours(db, b.id) - memberHours(db, a.id)).slice(0, 5);

  const cur = series[series.length - 1].value;
  const prev = series[series.length - 2].value;
  const delta = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 100;

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHead eyebrow={`${db.org.name} · admin console`} title={`${greet}, ${me?.firstName}.`} sub={new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}>
        <div className="flex items-center gap-2.5 bg-pine-900 text-paper rounded-[10px] px-4 h-10">
          <Clock className="text-[15px] font-semibold" />
          <span className="w-px h-4 bg-white/20" />
          <span className="text-[11px] uppercase tracking-wider text-pine-200 font-bold">front desk</span>
        </div>
      </PageHead>

      {/* bento row 1 */}
      <div className="grid grid-cols-12 gap-4">
        <section className={`${card} col-span-12 lg:col-span-5 p-5 relative overflow-hidden anim-rise`}>
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full opacity-[0.08]" style={{ background: "var(--acc)" }} />
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-soft">Hours contributed · all time</p>
            <Chip tone={delta >= 0 ? "pine" : "warn"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs last mo</Chip>
          </div>
          <p className="font-display text-[46px] font-bold leading-none mt-3 tnum">
            {hoursAnim.toFixed(0)}<span className="text-[24px] text-soft font-semibold">h</span>
          </p>
          <p className="text-[12.5px] text-soft mt-1.5">
            ≈ <span className="font-mono font-semibold text-ink">${Math.round(th * db.org.valuePerHour).toLocaleString()}</span> estimated community value
          </p>
          <div className="mt-4 -mx-1">
            <Spark data={series.map((s) => s.value)} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-faint mt-1 px-1">
            <span>{series[0].label}</span><span>this month · {fmtH(cur)}</span>
          </div>
        </section>

        <section className={`${card} col-span-12 sm:col-span-6 lg:col-span-3 p-5 anim-rise`} style={{ animationDelay: "60ms" }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-soft">Active volunteers</p>
          <p className="font-display text-[40px] font-bold leading-none mt-3 tnum">{activeVols.length}</p>
          <div className="flex -space-x-2 mt-3.5">
            {activeVols.slice(0, 6).map((m) => (
              <Avatar key={m.id} name={fullName(m)} color={m.color} size={28} className="ring-2 ring-panel" />
            ))}
            {activeVols.length > 6 && (
              <span className="w-7 h-7 rounded-full bg-pine-100 text-pine-800 text-[10px] font-bold flex items-center justify-center ring-2 ring-panel">+{activeVols.length - 6}</span>
            )}
          </div>
          <p className="text-[12px] text-soft mt-3.5 flex items-center gap-1.5">
            <IcMedal size={14} className="text-[#c99322]" /> <span className="font-semibold text-ink tnum">{medaled}</span> medals earned so far
          </p>
        </section>

        <section className={`${card} col-span-12 sm:col-span-6 lg:col-span-4 p-5 anim-rise`} style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-soft">This week</p>
            <Btn size="sm" variant="ghost" onClick={() => go("events")}>All events <IcChevR size={13} /></Btn>
          </div>
          <p className="font-display text-[40px] font-bold leading-none mt-3 tnum">{fmtH(weekHours)}</p>
          <div className="mt-4 space-y-2.5">
            {upcoming.slice(0, 3).map((e) => {
              const regs = recordsFor(db, e.id).length;
              const live = eventState(e) === "live";
              return (
                <button key={e.id} onClick={() => go("events")} className="w-full text-left group cursor-pointer">
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="font-semibold truncate flex items-center gap-1.5">
                      {live && <LiveDot />}{e.title}
                    </span>
                    <span className="font-mono text-faint tnum shrink-0 ml-2">{regs}/{e.capacity}</span>
                  </div>
                  <Bar value={regs / e.capacity} tone={live ? "var(--color-pine-700)" : undefined} />
                </button>
              );
            })}
            {upcoming.length === 0 && <p className="text-[12.5px] text-faint">No upcoming events — plan one in Events.</p>}
          </div>
        </section>
      </div>

      {/* bento row 2 */}
      <div className="grid grid-cols-12 gap-4 mt-4">
        <section className={`${card} col-span-12 lg:col-span-5 p-5 anim-rise`} style={{ animationDelay: "160ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[16px]">Up next</h2>
            {signedInNow.length > 0 && (
              <Chip tone="live"><LiveDot /> {signedInNow.length} signed in now</Chip>
            )}
          </div>
          <div className="space-y-1.5">
            {upcoming.slice(0, 5).map((e) => {
              const d = new Date(e.start);
              const regs = recordsFor(db, e.id);
              const live = eventState(e) === "live";
              return (
                <button
                  key={e.id}
                  onClick={() => go("events")}
                  className="w-full flex items-center gap-3.5 rounded-[10px] px-2.5 py-2.5 hover:bg-pine-900/4 transition text-left group cursor-pointer"
                >
                  <span className={`w-12 shrink-0 rounded-[9px] text-center py-1.5 border ${live ? "bg-pine-900 border-pine-900 text-paper" : "bg-white/70 border-line"}`}>
                    <span className={`block text-[9px] font-bold uppercase tracking-wider ${live ? "text-[var(--acc)]" : "text-faint"}`}>{d.toLocaleDateString([], { weekday: "short" })}</span>
                    <span className="block font-display font-bold text-[17px] leading-tight tnum">{d.getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[13.5px] truncate group-hover:text-pine-800 transition-colors">{e.title}</span>
                    <span className="block text-[11.5px] text-soft font-mono">{fmtTime(e.start)} · {regs.length}/{e.capacity} registered</span>
                  </span>
                  {live ? <Chip tone="live"><LiveDot /> live</Chip> : <IcChevR size={15} className="text-faint group-hover:translate-x-0.5 group-hover:text-ink transition-all" />}
                </button>
              );
            })}
          </div>
        </section>

        <section className={`${card} col-span-12 lg:col-span-4 p-5 anim-rise`} style={{ animationDelay: "220ms" }}>
          <h2 className="font-display font-bold text-[16px] mb-4">Activity</h2>
          <div className="relative space-y-4 before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-px before:bg-line">
            {db.activity.slice(0, 7).map((a) => (
              <FeedRow key={a.id} a={a} />
            ))}
          </div>
        </section>

        <section className={`${card} col-span-12 lg:col-span-3 p-5 anim-rise`} style={{ animationDelay: "280ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-[16px]">Top volunteers</h2>
            <Btn size="sm" variant="ghost" onClick={() => go("impact")}>Impact <IcChevR size={13} /></Btn>
          </div>
          <div className="space-y-3">
            {top.map((m, i) => {
              const h = memberHours(db, m.id);
              const tier = tierFor(db.org.tiers, h);
              return (
                <div key={m.id} className="flex items-center gap-2.5">
                  <span className="w-4 font-mono text-[11px] text-faint tnum">{i + 1}</span>
                  <Avatar name={fullName(m)} color={m.color} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold truncate leading-tight">{fullName(m)}</p>
                    <p className="text-[10.5px] text-faint font-mono tnum">{memberEvents(db, m.id)} events</p>
                  </div>
                  {tier && <Rosette color={tier.color} size={20} />}
                  <span className="font-mono text-[12px] font-semibold tnum w-11 text-right">{fmtH(h)}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

function FeedRow({ a }: { a: Activity }) {
  const icon =
    a.kind === "email" ? <IcMail size={12} /> :
    a.kind === "medal" ? <IcMedal size={12} /> :
    a.kind === "walkin" ? <IcQr size={12} /> :
    a.kind === "edit" ? <IcPencil size={12} /> :
    a.kind === "payment" ? <IcCard size={12} /> :
    a.kind === "refund" ? <IcRefund size={12} /> :
    a.kind === "register" ? <IcCal size={12} /> :
    a.kind === "system" ? <IcInfo size={12} /> : <IcIn size={12} />;
  const tint =
    a.kind === "medal" ? "bg-[color-mix(in_srgb,#e3a93c_20%,white)] text-[#8a6410]" :
    a.kind === "payment" ? "bg-[color-mix(in_srgb,#e3a93c_16%,white)] text-[#8a6410]" :
    a.kind === "refund" ? "bg-[color-mix(in_srgb,var(--color-clay)_12%,white)] text-clay" :
    a.kind === "walkin" ? "bg-pine-100 text-pine-700" :
    a.kind === "email" ? "bg-[color-mix(in_srgb,var(--acc)_16%,white)] text-[var(--acc-deep)]" :
    "bg-pine-100 text-pine-700";
  return (
    <div className="relative flex gap-3">
      <span className={`relative z-10 w-[27px] h-[27px] shrink-0 rounded-full flex items-center justify-center border border-line ${tint}`}>{icon}</span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[12px] leading-snug text-ink/90">{a.text}</p>
        <p className="text-[10.5px] font-mono text-faint mt-0.5">{relTime(a.at)}</p>
      </div>
    </div>
  );
}

