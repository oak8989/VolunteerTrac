import { useStore } from "../../lib/store";
import { eventHours, eventState, fmtDay, fmtMoney, fullName, memberEvents, memberHours, medalInfo, monthSeries, recordsFor, tierFor, totalHours, totalRevenue } from "../../lib/data";
import { Avatar, Bars, Bar as ProgressBar, card, Chip, fmtH, PageHead, Rosette, useCountUp } from "../../components/ui";
import { IcMedal } from "../../components/icons";

export default function InsightsView() {
  const { db } = useStore();
  const th = totalHours(db);
  const hoursAnim = useCountUp(th);
  const activeVols = db.members.filter((m) => m.active && m.role === "member");
  const held = db.events.filter((e) => eventState(e) === "past");
  const avg = activeVols.length ? th / activeVols.length : 0;
  const series = monthSeries(db, 8);

  // attendance rate across past events
  const pastRecs = db.attendance.filter((a) => held.some((e) => e.id === a.eventId));
  const showed = pastRecs.filter((a) => a.checkIn).length;
  const rate = pastRecs.length ? Math.round((showed / pastRecs.length) * 100) : 0;

  const leaderboard = [...db.members]
    .filter((m) => m.role === "member")
    .sort((a, b) => memberHours(db, b.id) - memberHours(db, a.id));

  const perEvent = [...held].sort((a, b) => b.start.localeCompare(a.start));
  const maxEventH = Math.max(1, ...perEvent.map((e) => eventHours(db, e.id)));

  const tiersSorted = [...db.org.tiers].sort((a, b) => a.hours - b.hours);
  const tierCount = (i: number) =>
    db.members.filter((m) => {
      const t = tierFor(db.org.tiers, memberHours(db, m.id));
      return t && t.name === tiersSorted[i].name;
    }).length;

  return (
    <>
      <PageHead eyebrow="Track your impact" title="Impact ledger" sub="Participation per member, per event, and across the whole organization — the numbers you put in the annual report." />

      {/* headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        {[
          { l: "Total hours", v: `${hoursAnim.toFixed(0)}h`, big: true },
          { l: "Est. community value", v: `$${Math.round(th * db.org.valuePerHour).toLocaleString()}` },
          { l: "Events held", v: String(held.length) },
          { l: "Avg / volunteer", v: fmtH(Math.round(avg * 10) / 10) },
          { l: "Show-up rate", v: `${rate}%` },
          { l: "Fees collected", v: fmtMoney(totalRevenue(db)) },
        ].map((s, i) => (
          <div key={s.l} className={`${card} px-4 py-3.5 anim-rise ${s.big ? "col-span-2 lg:col-span-1 bg-pine-900 border-pine-900 text-paper" : ""}`} style={{ animationDelay: `${i * 50}ms` }}>
            <p className={`text-[10.5px] font-bold uppercase tracking-[0.1em] ${s.big ? "text-pine-200" : "text-soft"}`}>{s.l}</p>
            <p className={`font-display font-bold tnum mt-1 ${s.big ? "text-[30px]" : "text-[22px]"}`} style={s.big ? { color: "var(--acc)" } : undefined}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* monthly chart */}
        <section className={`${card} col-span-12 lg:col-span-7 p-5 anim-rise`} style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-[16px]">Hours by month</h2>
            <Chip tone="acc">last 8 months</Chip>
          </div>
          <Bars data={series} height={190} />
        </section>

        {/* medal distribution */}
        <section className={`${card} col-span-12 lg:col-span-5 p-5 anim-rise`} style={{ animationDelay: "180ms" }}>
          <h2 className="font-display font-bold text-[16px] mb-5">Medal distribution</h2>
          <div className="space-y-4">
            {tiersSorted.map((t, i) => {
              const c = tierCount(i);
              return (
                <div key={t.name}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <Rosette color={t.color} size={22} />
                    <span className="text-[13px] font-semibold flex-1">{t.name}</span>
                    <span className="font-mono text-[11px] text-faint tnum">{t.hours}h+</span>
                    <span className="font-mono text-[13px] font-bold tnum w-6 text-right">{c}</span>
                  </div>
                  <ProgressBar value={db.members.length ? c / db.members.length : 0} tone={t.color} />
                </div>
              );
            })}
          </div>
          <p className="text-[11.5px] text-faint mt-5 flex items-center gap-1.5">
            <IcMedal size={13} className="text-pine-600" /> Thresholds are configurable in Settings → Awards.
          </p>
        </section>

        {/* leaderboard */}
        <section className={`${card} col-span-12 lg:col-span-7 overflow-hidden anim-rise`} style={{ animationDelay: "240ms" }}>
          <div className="px-5 pt-4.5 pb-3 border-b border-line flex items-center justify-between">
            <h2 className="font-display font-bold text-[16px]">Volunteer leaderboard</h2>
            <Chip tone="pine">{activeVols.length} active</Chip>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <tbody>
                {leaderboard.map((m, i) => {
                  const h = memberHours(db, m.id);
                  const info = medalInfo(db.org.tiers, h);
                  const tier = tierFor(db.org.tiers, h);
                  return (
                    <tr key={m.id} className={`border-b border-line last:border-0 hover:bg-pine-900/3 transition-colors ${!m.active ? "opacity-55" : ""}`}>
                      <td className="pl-5 pr-2 py-2.5 w-8 font-mono text-[12px] text-faint tnum">{i + 1}</td>
                      <td className="px-2 py-2.5">
                        <span className="flex items-center gap-2.5">
                          <Avatar name={fullName(m)} color={m.color} size={30} />
                          <span className="min-w-0">
                            <span className="font-semibold block truncate">{fullName(m)}{!m.active && <span className="text-faint font-normal"> · inactive</span>}</span>
                            <span className="text-[11px] text-faint font-mono tnum">{memberEvents(db, m.id)} events</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-2 py-2.5 w-10">{tier ? <Rosette color={tier.color} size={22} /> : <span className="text-faint text-[11px]">—</span>}</td>
                      <td className="px-2 py-2.5 w-[30%]">
                        {info.next ? (
                          <>
                            <ProgressBar value={info.progress} tone={info.next.color} />
                            <p className="text-[10px] font-mono text-faint mt-1 tnum">{(info.next.hours - h).toFixed(1)}h to {info.next.name}</p>
                          </>
                        ) : (
                          <Chip tone="gold">max honor</Chip>
                        )}
                      </td>
                      <td className="pl-2 pr-5 py-2.5 text-right font-mono font-bold tnum text-[13.5px]">{fmtH(h)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* per event */}
        <section className={`${card} col-span-12 lg:col-span-5 overflow-hidden anim-rise`} style={{ animationDelay: "300ms" }}>
          <div className="px-5 pt-4.5 pb-3 border-b border-line">
            <h2 className="font-display font-bold text-[16px]">Per-event breakdown</h2>
          </div>
          <div className="divide-y divide-line max-h-[420px] overflow-y-auto">
            {perEvent.map((e) => {
              const recs = recordsFor(db, e.id);
              const eh = eventHours(db, e.id);
              const checked = recs.filter((r) => r.checkIn).length;
              return (
                <div key={e.id} className="px-5 py-3 hover:bg-pine-900/3 transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="text-[13px] font-semibold truncate">{e.title}</p>
                    <p className="font-mono text-[12px] font-bold tnum shrink-0" style={{ color: "var(--acc-deep)" }}>{fmtH(eh)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProgressBar value={eh / maxEventH} className="flex-1" />
                    <p className="font-mono text-[10.5px] text-faint tnum shrink-0">{fmtDay(e.start)} · {checked}/{recs.length} showed</p>
                  </div>
                </div>
              );
            })}
            {perEvent.length === 0 && <p className="px-5 py-8 text-[13px] text-faint text-center">No completed events yet.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
