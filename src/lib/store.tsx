import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Attendance, DB, EventItem, Member, OrgSettings, Payment } from "./data";
import { AVATAR_COLORS, fmtMoney, fullName, memberHours, receiptId, seed, SEED_V, tierFor, uid } from "./data";

const KEY = "volunteertrac:db";

export interface Toast {
  id: string;
  kind: "ok" | "info" | "medal" | "warn";
  title: string;
  sub?: string;
}

interface Ctx {
  db: DB;
  me: Member | null;
  toasts: Toast[];
  toast: (kind: Toast["kind"], title: string, sub?: string) => void;
  dismiss: (id: string) => void;
  login: (id: string) => void;
  logout: () => void;
  saveOrg: (patch: Partial<OrgSettings>) => void;
  addMember: (m: Omit<Member, "id" | "joinedAt" | "waiverSignedAt" | "password" | "color">) => Member;
  updateMember: (id: string, patch: Partial<Member>) => void;
  addEvents: (evts: EventItem[]) => void;
  removeEvent: (id: string) => void;
  register: (eventId: string, memberId: string, payment?: Payment) => void;
  unregister: (eventId: string, memberId: string) => void;
  markPaid: (attId: string, amount: number) => void;
  attemptLogin: (email: string, password: string) => { member?: Member; error?: string };
  createAccount: (d: { firstName: string; lastName: string; email: string; password: string }) => { member?: Member; error?: string };
  resetPassword: (email: string) => boolean;
  checkIn: (eventId: string, memberId: string, walkIn?: boolean) => void;
  checkOut: (eventId: string, memberId: string) => void;
  saveTimes: (attId: string, checkIn: string | null, checkOut: string | null) => void;
  removeAttendance: (attId: string) => void;
  signWaiver: (memberId: string) => void;
  resetDemo: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as DB;
      if (d && d.v === SEED_V) return d;
    }
  } catch {
    /* corrupted -> reseed */
  }
  return seed();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* storage full — ignore */
    }
  }, [db]);

  const dismiss = useCallback((id: string) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (kind: Toast["kind"], title: string, sub?: string) => {
      const id = uid();
      setToasts((ts) => [...ts.slice(-3), { id, kind, title, sub }]);
      window.setTimeout(() => dismiss(id), kind === "medal" ? 6500 : 4200);
    },
    [dismiss]
  );

  const log = useCallback((kind: DB["activity"][number]["kind"], text: string) => {
    setDb((d) => ({ ...d, activity: [{ id: uid(), at: new Date().toISOString(), kind, text }, ...d.activity].slice(0, 80) }));
  }, []);

  // fires a medal toast if the update crosses a tier upward for memberId
  const medalCheck = useCallback(
    (memberId: string, beforeDb: DB) => {
      const after = dbRef.current;
      const tiers = after.org.tiers;
      const before = tierFor(tiers, memberHours(beforeDb, memberId));
      const nowH = memberHours(after, memberId);
      const afterT = tierFor(tiers, nowH);
      if (afterT && afterT.name !== before?.name) {
        const m = after.members.find((x) => x.id === memberId);
        if (!m) return;
        const isNewest = [...tiers].sort((a, b) => b.hours - a.hours)[0].name === afterT.name;
        toast("medal", `${fullName(m)} unlocked the ${afterT.name} medal`, `${nowH} volunteer hours logged${isNewest ? " — top honor!" : ""}`);
        setDb((d) => ({
          ...d,
          activity: [{ id: uid(), at: new Date().toISOString(), kind: "medal" as const, text: `${fullName(m)} unlocked the ${afterT.name} medal (${afterT.hours}+ hours)` }, ...d.activity].slice(0, 80),
        }));
      }
    },
    [toast]
  );

  const value = useMemo<Ctx>(() => {
    const set = (fn: (d: DB) => DB) => setDb(fn);
    return {
      db,
      me: db.members.find((m) => m.id === db.session) || null,
      toasts,
      toast,
      dismiss,
      login: (id) => {
        set((d) => ({ ...d, session: id }));
        const m = dbRef.current.members.find((x) => x.id === id);
        if (m) toast("ok", `Welcome back, ${m.firstName}`, m.role === "admin" ? "Signed in to the admin console" : "Signed in to your member portal");
      },
      logout: () => set((d) => ({ ...d, session: null })),

      saveOrg: (patch) => {
        set((d) => ({ ...d, org: { ...d.org, ...patch } }));
      },

      addMember: (m) => {
        const colors = ["#2A7760", "#B26B2F", "#3E6E8E", "#7C5C9E", "#A8563E", "#5A7D3A", "#B08A2E", "#4E8A7C"];
        const nm: Member = { ...m, id: uid(), joinedAt: new Date().toISOString(), waiverSignedAt: null, password: "demo1234", color: colors[Math.floor(Math.random() * colors.length)] };
        set((d) => ({ ...d, members: [...d.members, nm] }));
        log("email", `Invitation email sent to ${nm.email} — temporary password enclosed`);
        toast("ok", `${nm.firstName} ${nm.lastName} added`, "Invitation email sent (simulated)");
        return nm;
      },

      updateMember: (id, patch) => set((d) => ({ ...d, members: d.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

      addEvents: (evts) => {
        set((d) => ({ ...d, events: [...d.events, ...evts] }));
        log("system", evts.length > 1 ? `Recurring series created: ${evts[0].title} × ${evts.length} dates` : `Event created: ${evts[0].title}`);
        toast("ok", evts.length > 1 ? `Series scheduled — ${evts.length} dates` : "Event published", evts.length > 1 ? evts[0].title : undefined);
      },

      removeEvent: (id) => {
        const ev = dbRef.current.events.find((e) => e.id === id);
        set((d) => ({ ...d, events: d.events.filter((e) => e.id !== id), attendance: d.attendance.filter((a) => a.eventId !== id) }));
        if (ev) log("system", `Event removed: ${ev.title} (attendance records archived)`);
        toast("warn", "Event removed", ev?.title);
      },

      register: (eventId, memberId, payment) => {
        const d0 = dbRef.current;
        const ev = d0.events.find((e) => e.id === eventId);
        const m = d0.members.find((x) => x.id === memberId);
        if (!ev || !m) return;
        if (d0.attendance.some((a) => a.eventId === eventId && a.memberId === memberId)) return;
        set((d) => ({ ...d, attendance: [...d.attendance, { id: uid(), eventId, memberId, checkIn: null, checkOut: null, walkIn: false, note: "", payment: payment || null }] }));
        log("register", `${fullName(m)} registered for ${ev.title}`);
        log("email", `Confirmation email sent to ${m.email} for ${ev.title}`);
        if (payment) {
          log("payment", `${fullName(m)} paid ${fmtMoney(payment.amount)} for ${ev.title} (${payment.receipt})`);
          toast("ok", "Payment received", `${fmtMoney(payment.amount)} · receipt ${payment.receipt} emailed to ${m.email}`);
        } else {
          toast("ok", "Registration confirmed", `A confirmation email was sent to ${m.email} (simulated)`);
        }
      },

      unregister: (eventId, memberId) => {
        const d0 = dbRef.current;
        const rec = d0.attendance.find((a) => a.eventId === eventId && a.memberId === memberId && !a.checkIn);
        const ev = d0.events.find((e) => e.id === eventId);
        const m = d0.members.find((x) => x.id === memberId);
        set((d) => ({ ...d, attendance: d.attendance.filter((a) => !(a.eventId === eventId && a.memberId === memberId && !a.checkIn)) }));
        if (rec?.payment && ev && m) {
          log("refund", `Refund of ${fmtMoney(rec.payment.amount)} issued to ${fullName(m)} for ${ev.title} (${rec.payment.receipt})`);
          toast("info", "Registration cancelled", `Refund of ${fmtMoney(rec.payment.amount)} issued to the original card`);
        } else {
          toast("info", "Registration cancelled");
        }
      },

      markPaid: (attId, amount) => {
        const d0 = dbRef.current;
        const rec = d0.attendance.find((a) => a.id === attId);
        const pay: Payment = { amount, at: new Date().toISOString(), receipt: receiptId(), method: "manual" };
        set((d) => ({ ...d, attendance: d.attendance.map((a) => (a.id === attId ? { ...a, payment: pay } : a)) }));
        const m = d0.members.find((x) => x.id === rec?.memberId);
        const ev = d0.events.find((e) => e.id === rec?.eventId);
        if (m && ev) log("payment", `${fullName(m)} marked paid for ${ev.title} (${fmtMoney(amount)} · ${pay.receipt})`);
        toast("ok", "Payment recorded", `${fmtMoney(amount)} · ${pay.receipt}`);
      },

      attemptLogin: (email, password) => {
        const m = dbRef.current.members.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!m) return { error: "No account matches that email." };
        if (m.password !== password) return { error: "Incorrect password — try again or reset it below." };
        if (!m.active) return { error: "This account has been deactivated. Contact your coordinator." };
        set((d) => ({ ...d, session: m.id }));
        toast("ok", `Welcome back, ${m.firstName}`, m.role === "admin" ? "Signed in to the admin console" : "Signed in to your member portal");
        return { member: m };
      },

      createAccount: ({ firstName, lastName, email, password }) => {
        const d0 = dbRef.current;
        if (d0.members.some((x) => x.email.toLowerCase() === email.trim().toLowerCase()))
          return { error: "An account with that email already exists — sign in instead." };
        const nm: Member = {
          id: uid(), firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(),
          phone: "", title: "New Volunteer", role: "member", groups: [], active: true,
          joinedAt: new Date().toISOString(), color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          waiverSignedAt: null, password,
        };
        set((d) => ({ ...d, members: [...d.members, nm], session: nm.id }));
        log("email", `Welcome email sent to ${nm.email} — account created from the public site`);
        toast("ok", `Welcome aboard, ${nm.firstName}`, "Your volunteer account is ready");
        return { member: nm };
      },

      resetPassword: (email) => {
        const m = dbRef.current.members.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!m) return false;
        log("email", `Password reset link sent to ${m.email} (expires in 30 min)`);
        toast("ok", "Reset link sent", `Check ${m.email} — the link expires in 30 minutes (simulated)`);
        return true;
      },

      checkIn: (eventId, memberId, walkIn = false) => {
        const d0 = dbRef.current;
        const ev = d0.events.find((e) => e.id === eventId);
        const m = d0.members.find((x) => x.id === memberId);
        if (!ev || !m) return;
        const now = new Date().toISOString();
        const existing = d0.attendance.find((a) => a.eventId === eventId && a.memberId === memberId);
        if (existing) {
          if (existing.checkIn && !existing.checkOut) return;
          set((d) => ({ ...d, attendance: d.attendance.map((a) => (a.id === existing.id ? { ...a, checkIn: now, walkIn: a.walkIn || walkIn } : a)) }));
        } else {
          set((d) => ({ ...d, attendance: [...d.attendance, { id: uid(), eventId, memberId, checkIn: now, checkOut: null, walkIn, note: "", payment: null }] }));
        }
        log(walkIn ? "walkin" : "checkin", `${fullName(m)} ${walkIn ? "scanned the walk-in QR at" : "checked in to"} ${ev.title}`);
        toast("ok", `${m.firstName} checked in`, `${ev.title}${walkIn ? " · walk-in QR" : ""}`);
      },

      checkOut: (eventId, memberId) => {
        const d0 = dbRef.current;
        const now = new Date().toISOString();
        set((d) => ({
          ...d,
          attendance: d.attendance.map((a) => (a.eventId === eventId && a.memberId === memberId && a.checkIn && !a.checkOut ? { ...a, checkOut: now } : a)),
        }));
        const ev = d0.events.find((e) => e.id === eventId);
        const m = d0.members.find((x) => x.id === memberId);
        if (ev && m) log("checkin", `${fullName(m)} checked out of ${ev.title}`);
        window.setTimeout(() => medalCheck(memberId, d0), 60);
        if (m && ev) toast("ok", `${m.firstName} checked out`, `${ev.title} — hours logged`);
      },

      saveTimes: (attId, checkIn, checkOut) => {
        const d0 = dbRef.current;
        const rec = d0.attendance.find((a) => a.id === attId);
        set((d) => ({ ...d, attendance: d.attendance.map((a) => (a.id === attId ? { ...a, checkIn, checkOut } : a)) }));
        if (rec) {
          const ev = d0.events.find((e) => e.id === rec.eventId);
          const m = d0.members.find((x) => x.id === rec.memberId);
          const by = d0.members.find((x) => x.id === d0.session);
          if (ev && m) log("edit", `${by ? fullName(by) : "Admin"} corrected attendance for ${fullName(m)} at ${ev.title}`);
          window.setTimeout(() => medalCheck(rec.memberId, d0), 60);
        }
        toast("ok", "Attendance updated", "Times saved to the event ledger");
      },

      removeAttendance: (attId) => {
        set((d) => ({ ...d, attendance: d.attendance.filter((a) => a.id !== attId) }));
        toast("info", "Removed from event");
      },

      signWaiver: (memberId) => {
        const now = new Date().toISOString();
        set((d) => ({ ...d, members: d.members.map((m) => (m.id === memberId ? { ...m, waiverSignedAt: now } : m)) }));
        const m = dbRef.current.members.find((x) => x.id === memberId);
        if (m) log("system", `${fullName(m)} signed the ${dbRef.current.org.waiver.title}`);
        toast("ok", "Waiver signed", "Stored on the member profile");
      },

      resetDemo: () => {
        localStorage.removeItem(KEY);
        setDb(seed());
        toast("ok", "Demo data reset", "Fresh seed data loaded");
      },
    };
  }, [db, toasts, toast, dismiss, log, medalCheck]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

export type { Attendance };
