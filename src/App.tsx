import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { StoreProvider, useStore } from "./lib/store";
import { darken, fullName, totalHours } from "./lib/data";
import Login from "./views/Login";
import DashboardView from "./views/admin/DashboardView";
import EventsView from "./views/admin/EventsView";
import PeopleView from "./views/admin/PeopleView";
import InsightsView from "./views/admin/InsightsView";
import SettingsView from "./views/admin/SettingsView";
import DeployView from "./views/admin/DeployView";
import Portal from "./views/portal/Portal";
import { Avatar } from "./components/ui";
import { IcCal, IcCheck, IcClock, IcDash, IcGear, IcHome, IcInfo, IcLogout, IcMedal, IcMenu, IcRocket, IcUser, IcUsers, IcX, LogoMark } from "./components/icons";

const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: IcDash },
  { id: "events", label: "Events", icon: IcCal },
  { id: "members", label: "Members", icon: IcUsers },
  { id: "impact", label: "Impact", icon: IcMedal },
  { id: "settings", label: "Settings", icon: IcGear },
  { id: "deploy", label: "Deploy", icon: IcRocket },
];
const MEMBER_NAV = [
  { id: "home", label: "My home", icon: IcHome },
  { id: "events", label: "Events", icon: IcCal },
  { id: "history", label: "My hours", icon: IcClock },
  { id: "profile", label: "Profile", icon: IcUser },
];

const onAccent = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const l = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return l > 150 ? "#231a05" : "#fdf8ec";
};

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}

function Root() {
  const { db, me } = useStore();
  const [tab, setTab] = useState("dashboard");
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const role = db.members.find((m) => m.id === db.session)?.role;
    setTab(role === "admin" ? "dashboard" : "home");
    setMenu(false);
  }, [db.session, db.members]);

  const vars = {
    "--acc": db.org.accent,
    "--acc-deep": darken(db.org.accent, 0.34),
    "--acc-ink": onAccent(db.org.accent),
  } as CSSProperties;

  if (!me) {
    return (
      <div style={vars} className="min-h-screen bg-paper text-ink font-sans">
        <Login />
        <ToastHost />
      </div>
    );
  }

  const nav = me.role === "admin" ? ADMIN_NAV : MEMBER_NAV;
  const content =
    me.role === "admin" ? (
      tab === "events" ? <EventsView /> :
      tab === "members" ? <PeopleView /> :
      tab === "impact" ? <InsightsView /> :
      tab === "settings" ? <SettingsView key={db.seededAt} /> :
      tab === "deploy" ? <DeployView /> :
      <DashboardView go={setTab} />
    ) : (
      <Portal tab={tab} go={setTab} />
    );

  return (
    <div style={vars} className="min-h-screen bg-paper text-ink font-sans">
      {/* ambient layers */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(900px 480px at 85% -10%, color-mix(in srgb, var(--acc) 9%, transparent), transparent 62%), radial-gradient(760px 560px at -10% 110%, rgba(42,119,96,.10), transparent 60%)" }}
      />
      <div className="fixed inset-0 dotsbg opacity-25 pointer-events-none z-0" />

      {/* desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[252px] z-40 flex-col bg-pine-950 text-paper overflow-hidden">
        <SidebarSkin />
        <NavContent nav={nav} tab={tab} setTab={setTab} />
      </aside>

      {/* mobile drawer */}
      {menu && (
        <div className="lg:hidden fixed inset-0 z-[65]">
          <div className="absolute inset-0 bg-pine-950/55" onClick={() => setMenu(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] bg-pine-950 text-paper flex flex-col overflow-hidden anim-rise">
            <SidebarSkin onClose={() => setMenu(false)} />
            <NavContent nav={nav} tab={tab} setTab={(t) => { setTab(t); setMenu(false); }} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[252px] relative z-10">
        {/* mobile topbar */}
        <header className="lg:hidden sticky top-0 z-40 h-14 bg-pine-950 text-paper flex items-center gap-3 px-4">
          <button onClick={() => setMenu(true)} className="p-1.5 -ml-1 rounded-lg hover:bg-white/10 transition cursor-pointer" aria-label="Open menu"><IcMenu size={19} /></button>
          {db.org.logoDataUrl ? <img src={db.org.logoDataUrl} alt="" className="w-7 h-7 rounded-lg object-cover" /> : <LogoMark variant={db.org.logoMark} size={28} />}
          <p className="font-display font-bold text-[14px] truncate flex-1">{db.org.name}</p>
          <Avatar name={fullName(me)} color={me.color} size={30} />
        </header>

        <main key={tab} className="anim-rise mx-auto max-w-[1180px] px-4 sm:px-7 py-6 lg:py-8">{content}</main>
      </div>

      <ToastHost />
    </div>
  );
}

function SidebarSkin({ onClose }: { onClose?: () => void }) {
  const { db, me, logout } = useStore();
  const hours = totalHours(db);
  const goal = 250;
  return (
    <>
      <div className="absolute inset-0 opacity-70" style={{ background: "radial-gradient(420px 260px at 20% -6%, color-mix(in srgb, var(--acc) 22%, transparent), transparent 60%), radial-gradient(380px 300px at 110% 108%, rgba(42,119,96,.30), transparent 62%)" }} />
      <div className="absolute inset-0 dotsbg opacity-[0.05]" />
      <div className="relative flex items-center gap-3 px-5 pt-5 pb-4">
        {db.org.logoDataUrl ? <img src={db.org.logoDataUrl} alt="" className="w-10 h-10 rounded-[10px] object-cover shrink-0" /> : <LogoMark variant={db.org.logoMark} size={40} />}
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-[14.5px] leading-tight truncate">{db.org.name}</p>
          <p className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-pine-300 mt-0.5">volunteertrac</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer" aria-label="Close menu"><IcX size={16} /></button>
        )}
      </div>
      <div className="relative mx-4 mb-2 rounded-[10px] bg-white/5 border border-white/10 px-3.5 py-3">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-pine-300">Org hours</p>
          <p className="font-mono text-[13px] font-semibold tnum" style={{ color: "var(--acc)" }}>{Math.round(hours)}h</p>
        </div>
        <span className="block h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
          <span className="block h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (hours / goal) * 100)}%`, background: "var(--acc)" }} />
        </span>
        <p className="text-[9.5px] font-mono text-pine-300 mt-1.5 tnum">season goal · {goal}h</p>
      </div>
      {me && (
        <div className="relative mt-auto border-t border-white/10 p-3.5 flex items-center gap-2.5">
          <Avatar name={fullName(me)} color={me.color} size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold truncate">{fullName(me)}</p>
            <p className="text-[10.5px] text-pine-300 font-mono uppercase tracking-wide">{me.role === "admin" ? "admin console" : "member portal"}</p>
          </div>
          <button
            onClick={logout}
            title="Switch account"
            className="p-2 rounded-lg text-pine-200 hover:bg-white/10 hover:text-paper transition cursor-pointer"
          >
            <IcLogout size={16} />
          </button>
        </div>
      )}
    </>
  );
}

function NavContent({ nav, tab, setTab }: { nav: typeof ADMIN_NAV; tab: string; setTab: (t: string) => void }) {
  return (
    <nav className="relative flex-1 px-3 pt-3 space-y-1 overflow-y-auto">
      {nav.map((item) => {
        const active = tab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`relative w-full flex items-center gap-2.5 h-10 px-3 rounded-[9px] text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
              active ? "bg-white/10 text-paper" : "text-pine-200 hover:bg-white/5 hover:text-paper"
            }`}
          >
            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: "var(--acc)" }} />}
            <Icon size={17} className={active ? "" : "opacity-80"} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function ToastHost() {
  const { toasts, dismiss } = useStore();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-[95] w-[min(92vw,352px)] space-y-2">
      {toasts.map((t) => (
        <div key={t.id} className="anim-toast flex gap-3 items-start bg-pine-950 text-paper rounded-xl border border-pine-800 shadow-[0_12px_34px_-12px_rgba(5,20,15,.6)] p-3.5">
          <span
            className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center mt-0.5"
            style={{
              background: t.kind === "medal" ? "#e3a93c" : t.kind === "warn" ? "var(--color-clay)" : t.kind === "info" ? "var(--color-pine-600)" : "var(--acc)",
              color: t.kind === "medal" ? "#241a03" : t.kind === "info" ? "#eaf4ee" : "var(--acc-ink)",
            }}
          >
            {t.kind === "medal" ? <IcMedal size={15} /> : t.kind === "warn" || t.kind === "info" ? <IcInfo size={15} /> : <IcCheck size={15} />}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[13px] font-bold leading-snug">{t.title}</p>
            {t.sub && <p className="text-[11.5px] text-pine-200 mt-0.5 leading-snug">{t.sub}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="p-1 rounded-md text-pine-300 hover:text-paper hover:bg-white/10 transition cursor-pointer" aria-label="Dismiss">
            <IcX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
