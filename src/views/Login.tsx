import { useStore } from "../lib/store";
import { fmtDayLong, fullName, memberHours, medalInfo, tierFor, totalHours } from "../lib/data";
import { Avatar, Chip, Clock, Rosette } from "../components/ui";
import { IcChevR, IcShield, LogoMark } from "../components/icons";

export default function Login() {
  const { db, login } = useStore();
  const admins = db.members.filter((m) => m.role === "admin" && m.active);
  const vols = db.members.filter((m) => m.role === "member" && m.active);
  const hours = totalHours(db);
  const held = db.events.filter((e) => new Date(e.end).getTime() < Date.now()).length;
  const medaled = db.members.filter((m) => tierFor(db.org.tiers, memberHours(db, m.id))).length;

  return (
    <div className="min-h-screen flex">
      {/* brand panel */}
      <aside className="hidden lg:flex flex-col w-[46%] max-w-[620px] bg-pine-950 text-paper relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(700px 420px at 18% -8%, color-mix(in srgb, var(--acc) 26%, transparent), transparent 62%), radial-gradient(600px 500px at 110% 105%, rgba(42,119,96,.35), transparent 60%)" }}
        />
        <div className="absolute inset-0 dotsbg opacity-[0.05]" />
        <div className="relative flex flex-col h-full px-12 py-10">
          <div className="flex items-center gap-3.5">
            {db.org.logoDataUrl ? (
              <img src={db.org.logoDataUrl} alt="" className="w-11 h-11 rounded-[10px] object-cover" />
            ) : (
              <LogoMark variant={db.org.logoMark} size={44} />
            )}
            <div>
              <p className="font-display font-bold text-[19px] leading-tight">{db.org.name}</p>
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-pine-300 mt-0.5">powered by Volunteertrac</p>
            </div>
          </div>

          <div className="mt-16 max-w-[430px]">
            <p className="font-display text-[38px] leading-[1.06] font-bold tracking-tight">
              Every hour your neighbors give, <span style={{ color: "var(--acc)" }}>counted.</span>
            </p>
            <p className="mt-5 text-[14.5px] leading-relaxed text-pine-200">{db.org.mission}</p>
          </div>

          <div className="mt-auto space-y-8">
            <div className="flex items-end gap-3">
              <Clock className="text-[44px] leading-none font-semibold text-paper" />
              <div className="pb-1">
                <p className="text-[12px] text-pine-300">{fmtDayLong(new Date().toISOString())}</p>
                <p className="text-[11px] font-mono uppercase tracking-[0.14em] mt-1" style={{ color: "var(--acc)" }}>
                  {db.org.address.split(",").slice(1).join(",").trim()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10">
              {[
                { k: `${Math.round(hours)}h`, l: "volunteered" },
                { k: `${held}`, l: "events held" },
                { k: `${medaled}`, l: "medals earned" },
              ].map((s) => (
                <div key={s.l} className="bg-pine-950/90 px-4 py-3.5">
                  <p className="font-display text-[22px] font-bold tnum" style={{ color: "var(--acc)" }}>{s.k}</p>
                  <p className="text-[11px] text-pine-300 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] font-mono text-pine-300/80 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--acc)" }} />
              self-hosted · one command: <span className="text-paper">docker compose up</span>
            </p>
            <p className="text-[11px] font-mono text-pine-300/80 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--acc)" }} />
              github: <span className="text-paper">oak8989/volunteertrac</span> · image: <span className="text-paper">ghcr.io/oak8989/volunteertrac</span>
            </p>
          </div>
        </div>
      </aside>

      {/* account picker */}
      <main className="flex-1 flex flex-col justify-center px-6 sm:px-14 py-10 relative">
        <div className="absolute inset-0 dotsbg opacity-35 pointer-events-none" />
        <div className="relative max-w-[560px] w-full mx-auto lg:mx-0 anim-rise">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            {db.org.logoDataUrl ? (
              <img src={db.org.logoDataUrl} alt="" className="w-10 h-10 rounded-[10px] object-cover" />
            ) : (
              <LogoMark variant={db.org.logoMark} size={40} />
            )}
            <div>
              <p className="font-display font-bold text-[17px] leading-tight">{db.org.name}</p>
              <p className="text-[10.5px] font-mono uppercase tracking-[0.16em] text-soft">powered by Volunteertrac</p>
            </div>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-soft">Volunteer workspace</p>
          <h1 className="font-display text-[30px] sm:text-[34px] font-bold tracking-tight mt-1.5 leading-tight">
            Who's clocking in today?
          </h1>
          <p className="text-[13.5px] text-soft mt-2">
            Pick a demo identity — admins run the console, members get the volunteer portal. Everything you do persists in this browser.
          </p>

          <div className="mt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint mb-2.5">Organization admin</p>
            <div className="space-y-2">
              {admins.map((m) => (
                <AccountRow key={m.id} name={fullName(m)} meta={m.email} color={m.color} onClick={() => login(m.id)} badge={<Chip tone="ink">Admin</Chip>} />
              ))}
            </div>
          </div>

          <div className="mt-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint mb-2.5">Volunteers</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {vols.map((m) => {
                const h = memberHours(db, m.id);
                const tier = tierFor(db.org.tiers, h);
                const next = medalInfo(db.org.tiers, h).next;
                return (
                  <AccountRow
                    key={m.id}
                    name={fullName(m)}
                    meta={`${h % 1 === 0 ? h : h.toFixed(1)}h logged${next ? ` · next: ${next.name}` : " · max medal"}`}
                    color={m.color}
                    onClick={() => login(m.id)}
                    badge={tier ? <Rosette color={tier.color} size={20} /> : undefined}
                    compact
                  />
                );
              })}
            </div>
          </div>

          <p className="mt-8 text-[11.5px] text-faint flex items-center gap-2">
            <IcShield size={14} className="text-pine-600" />
            Waivers, white-label branding and award thresholds are configurable in Admin → Settings.
          </p>
        </div>
      </main>
    </div>
  );
}

function AccountRow({
  name, meta, color, onClick, badge, compact = false,
}: { name: string; meta: string; color: string; onClick: () => void; badge?: React.ReactNode; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-3.5 rounded-xl border border-line bg-panel px-4 text-left transition-all duration-150 hover:border-[var(--acc)] hover:shadow-[0_4px_18px_-6px_rgba(20,40,30,.25)] hover:-translate-y-px active:translate-y-0 cursor-pointer ${compact ? "py-2.5" : "py-3.5"}`}
    >
      <Avatar name={name} color={color} size={compact ? 34 : 40} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-[14px] truncate">{name}</span>
        <span className="block text-[11.5px] text-soft truncate font-mono">{meta}</span>
      </span>
      {badge}
      <IcChevR size={15} className="text-faint group-hover:text-ink group-hover:translate-x-0.5 transition-all" />
    </button>
  );
}
