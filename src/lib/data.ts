import { appConfig } from "./config";

// ---------- domain types ----------
export type Role = "admin" | "member";

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  role: Role;
  groups: string[];
  active: boolean;
  joinedAt: string;
  color: string;
  waiverSignedAt: string | null;
  password: string;
}

export interface EventItem {
  id: string;
  seriesId: string | null;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  capacity: number;
  type: "public" | "private";
  invitees: string[];
  requireWaiver: boolean;
  /** per-person fee in USD; 0 = free event */
  fee: number;
  createdAt: string;
}

export interface Payment {
  amount: number;
  at: string;
  receipt: string;
  method: "card" | "manual";
}

export interface Attendance {
  id: string;
  eventId: string;
  memberId: string;
  checkIn: string | null;
  checkOut: string | null;
  walkIn: boolean;
  note: string;
  payment: Payment | null;
}

export interface Activity {
  id: string;
  at: string;
  kind: "email" | "checkin" | "register" | "medal" | "edit" | "system" | "walkin" | "payment" | "refund";
  text: string;
}

export interface Tier {
  name: string;
  hours: number;
  color: string;
}

export interface OrgSettings {
  name: string;
  tagline: string;
  mission: string;
  email: string;
  phone: string;
  address: string;
  ein: string;
  accent: string;
  logoDataUrl: string | null;
  logoMark: number;
  waiver: { title: string; body: string; required: boolean };
  tiers: Tier[];
  valuePerHour: number;
  payments: { enabled: boolean; accountLabel: string };
  smtp: { enabled: boolean; host: string; port: number; user: string; from: string };
}

export interface EmailMsg {
  id: string;
  to: string;
  subject: string;
  at: string;
  status: "delivered" | "queued";
}

export interface DB {
  v: number;
  seededAt: string;
  org: OrgSettings;
  members: Member[];
  events: EventItem[];
  attendance: Attendance[];
  activity: Activity[];
  emails: EmailMsg[];
  session: string | null;
}

// ---------- constants ----------
export const SEED_V = 6;
export const GROUPS = ["Trail Crew", "Food Pantry", "Youth Mentors", "Events Team"];
export const ACCENTS = [
  { name: "Marigold", hex: "#E8A61A" },
  { name: "Coral", hex: "#DE6A45" },
  { name: "River Teal", hex: "#2F7E8C" },
  { name: "Moss", hex: "#6E8F3C" },
  { name: "Plum", hex: "#8A4F7D" },
  { name: "Rosewood", hex: "#BE5368" },
];
export const AVATAR_COLORS = ["#2A7760", "#B26B2F", "#3E6E8E", "#7C5C9E", "#A8563E", "#5A7D3A", "#B08A2E", "#4E8A7C"];
export const TIER_COLORS = ["#B0763B", "#8E9BAA", "#E3A93C", "#7FA6A3"];

// ---------- small utils ----------
export const uid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);

export function at(days: number, h: number, m = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return d;
}
export const iso = (d: Date) => d.toISOString();

export function fmtDay(isoStr: string) {
  return new Date(isoStr).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}
export function fmtDayLong(isoStr: string) {
  return new Date(isoStr).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
export function fmtTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
export function fmtRange(e: EventItem) {
  return `${fmtDay(e.start)} · ${fmtTime(e.start)} – ${fmtTime(e.end)}`;
}
export function fmtMonthYear(isoStr: string) {
  return new Date(isoStr).toLocaleDateString([], { month: "short", year: "numeric" });
}
export function relTime(isoStr: string) {
  const diff = new Date(isoStr).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  let s: string;
  if (mins < 1) s = "moments";
  else if (mins < 60) s = `${mins}m`;
  else if (mins < 60 * 24) s = `${Math.round(mins / 60)}h`;
  else s = `${Math.round(mins / (60 * 24))}d`;
  return diff >= 0 ? `in ${s}` : `${s} ago`;
}
export function toLocal(isoStr: string) {
  const d = new Date(isoStr);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function fromLocal(s: string): string | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function darken(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const p = (v: number) => Math.max(0, Math.round(v * (1 - f)));
  return `#${((p((n >> 16) & 255) << 16) | (p((n >> 8) & 255) << 8) | p(n & 255)).toString(16).padStart(6, "0")}`;
}

// ---------- derived helpers ----------
export const hoursOf = (a: Attendance) =>
  a.checkIn && a.checkOut ? Math.max(0, Math.round(((new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 3600000) * 100) / 100) : 0;

export const recordsFor = (db: DB, eventId: string) => db.attendance.filter((a) => a.eventId === eventId);
export const recordFor = (db: DB, eventId: string, memberId: string) =>
  db.attendance.find((a) => a.eventId === eventId && a.memberId === memberId) || null;

export const memberHours = (db: DB, memberId: string) =>
  Math.round(db.attendance.filter((a) => a.memberId === memberId).reduce((s, a) => s + hoursOf(a), 0) * 100) / 100;

export const memberEvents = (db: DB, memberId: string) =>
  db.attendance.filter((a) => a.memberId === memberId && a.checkIn).length;

export const memberLastActive = (db: DB, memberId: string) => {
  const times = db.attendance
    .filter((a) => a.memberId === memberId && a.checkIn)
    .map((a) => new Date(a.checkOut || a.checkIn || 0).getTime());
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
};

export const eventHours = (db: DB, eventId: string) =>
  Math.round(recordsFor(db, eventId).reduce((s, a) => s + hoursOf(a), 0) * 100) / 100;

export const eventState = (e: EventItem): "past" | "live" | "upcoming" => {
  const now = Date.now();
  if (new Date(e.end).getTime() < now) return "past";
  if (new Date(e.start).getTime() <= now) return "live";
  return "upcoming";
};

export const totalHours = (db: DB) => Math.round(db.attendance.reduce((s, a) => s + hoursOf(a), 0) * 10) / 10;

// ---------- payments ----------
export const fmtMoney = (n: number) =>
  n.toLocaleString([], { style: "currency", currency: "USD", minimumFractionDigits: n % 1 === 0 ? 0 : 2 });

export const receiptId = () =>
  `RCPT-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.floor(10 + Math.random() * 89)}`;

export const rcptFor = (eventId: string, memberId: string) =>
  `RCPT-${(eventId + memberId).replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase()}`;

export const eventRevenue = (db: DB, eventId: string) =>
  Math.round(recordsFor(db, eventId).reduce((s, a) => s + (a.payment?.amount || 0), 0) * 100) / 100;

export const totalRevenue = (db: DB) =>
  Math.round(db.attendance.reduce((s, a) => s + (a.payment?.amount || 0), 0) * 100) / 100;

export function monthSeries(db: DB, n: number) {
  const out: { label: string; value: number }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const hrs = db.attendance.reduce((s, a) => {
      if (!a.checkIn) return s;
      const c = new Date(a.checkIn);
      return `${c.getFullYear()}-${c.getMonth()}` === key ? s + hoursOf(a) : s;
    }, 0);
    out.push({ label: d.toLocaleDateString([], { month: "short" }), value: Math.round(hrs * 10) / 10 });
  }
  return out;
}

// ---------- medals ----------
export function tierFor(tiers: Tier[], hours: number): Tier | null {
  const sorted = [...tiers].sort((a, b) => a.hours - b.hours);
  let cur: Tier | null = null;
  for (const t of sorted) if (hours >= t.hours) cur = t;
  return cur;
}
export function medalInfo(tiers: Tier[], hours: number) {
  const sorted = [...tiers].sort((a, b) => a.hours - b.hours);
  const earned = sorted.filter((t) => hours >= t.hours);
  const next = sorted.find((t) => hours < t.hours) || null;
  const base = next ? (earned.length ? earned[earned.length - 1].hours : 0) : 0;
  const progress = next ? Math.min(1, (hours - base) / (next.hours - base)) : 1;
  return { earned, next, progress };
}

// ---------- export ----------
export function toCSV(rows: (string | number)[][]) {
  return rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
export function downloadText(name: string, text: string, mime = "text/csv") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

export const fullName = (m: Member) => `${m.firstName} ${m.lastName}`;
export const initials = (m: Member) => `${m.firstName[0] || ""}${m.lastName[0] || ""}`.toUpperCase();

// ---------- seed ----------
export function seed(): DB {
  const now = new Date();
  const M = (
    id: string, firstName: string, lastName: string, email: string, phone: string, title: string,
    role: Role, groups: string[], active: boolean, joinedDays: number, color: string, waiver: boolean,
    password = "riverbend!"
  ): Member => ({
    id, firstName, lastName, email, phone, title, role, groups, active,
    joinedAt: iso(at(-joinedDays, 10)), color,
    waiverSignedAt: waiver ? iso(at(-joinedDays + 2, 11)) : null,
    password,
  });

  // Admin account is provisioned from the container environment
  // (ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD in docker-compose.yml).
  const [adminFirst, ...adminRest] = appConfig.admin.name.trim().split(/\s+/);
  const adminLast = adminRest.join(" ") || "Admin";

  const members: Member[] = [
    M("m-admin", adminFirst, adminLast, appConfig.admin.email, "(555) 014-2201", "Program Director", "admin", ["Events Team"], true, 420, AVATAR_COLORS[0], true, appConfig.admin.password),
    M("m-marcus", "Marcus", "Bell", "marcus.bell@gmail.com", "(555) 093-8817", "Trail Lead", "member", ["Trail Crew"], true, 310, AVATAR_COLORS[1], true),
    M("m-priya", "Priya", "Raman", "priya.raman@outlook.com", "(555) 042-1190", "Pantry Captain", "member", ["Food Pantry"], true, 280, AVATAR_COLORS[2], true),
    M("m-jordan", "Jordan", "Okafor", "jordan.okafor@gmail.com", "(555) 077-3342", "Mentor", "member", ["Youth Mentors"], true, 190, AVATAR_COLORS[3], true),
    M("m-elena", "Elena", "Vasquez", "elena.vz@proton.me", "(555) 068-9954", "Volunteer", "member", ["Food Pantry", "Trail Crew"], true, 160, AVATAR_COLORS[4], true),
    M("m-sam", "Sam", "Kowalski", "sam.kowalski@gmail.com", "(555) 029-7761", "Volunteer", "member", ["Events Team"], true, 120, AVATAR_COLORS[5], true),
    M("m-aisha", "Aisha", "Thompson", "aisha.t@yahoo.com", "(555) 051-2280", "Mentor", "member", ["Youth Mentors"], true, 75, AVATAR_COLORS[6], true),
    M("m-noah", "Noah", "Berg", "noah.berg@gmail.com", "(555) 083-4419", "Volunteer", "member", ["Trail Crew"], false, 300, AVATAR_COLORS[7], true),
    M("m-grace", "Grace", "Lin", "grace.lin@gmail.com", "(555) 036-8873", "New Volunteer", "member", ["Events Team"], true, 6, AVATAR_COLORS[2], false),
  ];

  const trailCrew = ["m-marcus", "m-elena", "m-noah"];
  const pantry = ["m-priya", "m-elena"];
  const mentors = ["m-jordan", "m-aisha"];

  const E = (
    id: string, seriesId: string | null, title: string, description: string, location: string,
    start: Date, end: Date, capacity: number, type: "public" | "private", invitees: string[], requireWaiver: boolean,
    fee = 0
  ): EventItem => ({
    id, seriesId, title, description, location, start: iso(start), end: iso(end),
    capacity, type, invitees, requireWaiver, fee, createdAt: iso(at(-120, 9)),
  });

  const events: EventItem[] = [
    E("e-coat", null, "Winter Coat Drive Sorting", "Sort and box donated coats for county shelters.", "Alliance Hall", at(-98, 10), at(-98, 16), 20, "public", [], false),
    E("e-c1", null, "River Cleanup Day", "Glove-up morning pulling litter along the east bank. Supplies provided.", "Riverbend Park, East Gate", at(-84, 9), at(-84, 13), 30, "public", [], true),
    E("e-p1", "s-pantry", "Pantry Restock Night", "Unload deliveries, rotate stock, prep weekend family boxes.", "Food Pantry Warehouse", at(-70, 17, 30), at(-70, 20, 30), 12, "private", pantry, false),
    E("e-t1", "s-trail", "Trail Maintenance Crew", "Re-cut switchbacks and clear stormfall on the north loop.", "Miller Ridge Trailhead", at(-56, 8), at(-56, 12), 10, "private", trailCrew, false),
    E("e-g1", null, "Community Garden Build", "Raise four new cedar beds with the parks department.", "8th St Community Garden", at(-42, 9), at(-42, 14), 25, "public", [], true),
    E("e-p2", "s-pantry", "Pantry Restock Night", "Unload deliveries, rotate stock, prep weekend family boxes.", "Food Pantry Warehouse", at(-35, 17, 30), at(-35, 20, 30), 12, "private", pantry, false),
    E("e-m1", null, "Mentor Orientation", "Training for new youth mentors — background check Q&A included.", "Alliance Hall, Room B", at(-28, 18), at(-28, 20), 14, "private", mentors, true),
    E("e-saw", null, "Chainsaw Safety Certification", "Certification for trail-crew chainsaw operators. Fee covers PPE materials and the cert card.", "Miller Ridge Trailhead", at(-30, 9), at(-30, 15), 12, "public", [], true, 35),
    E("e-t2", "s-trail", "Trail Maintenance Crew", "Water-bar installation on the lower descent.", "Miller Ridge Trailhead", at(-21, 8), at(-21, 12), 10, "private", trailCrew, false),
    E("e-c2", null, "River Cleanup Day", "Second-bank sweep plus invasive garlic-mustard pull.", "Riverbend Park, East Gate", at(-14, 9), at(-14, 13), 30, "public", [], true),
    E("e-p3", "s-pantry", "Pantry Restock Night", "Unload deliveries, rotate stock, prep weekend family boxes.", "Food Pantry Warehouse", at(-7, 17, 30), at(-7, 20, 30), 12, "private", pantry, false),
    E("e-lunch", null, "Volunteer Appreciation Lunch", "A thank-you lunch for every active volunteer — bring your appetite!", "Alliance Hall", new Date(now.getTime() - 45 * 60000), new Date(now.getTime() + 75 * 60000), 40, "public", [], false),
    E("e-t3", "s-trail", "Trail Maintenance Crew", "Signage refresh and tread work past the falls overlook.", "Miller Ridge Trailhead", at(2, 8), at(2, 12), 10, "private", trailCrew, false),
    E("e-p4", "s-pantry", "Pantry Restock Night", "Unload deliveries, rotate stock, prep weekend family boxes.", "Food Pantry Warehouse", at(5, 17, 30), at(5, 20, 30), 12, "private", pantry, false),
    E("e-m2", null, "Mentor Circle: Resume Workshop", "Help teens polish resumes and practice interviews.", "Alliance Hall, Room B", at(7, 18), at(7, 20), 14, "private", mentors, false),
    E("e-wfa", null, "Wilderness First Aid Certification", "WFA certification for trail leads and event captains. Fee covers the course manual and certification card.", "Alliance Hall, Room B", at(6, 9), at(6, 15), 16, "public", [], true, 45),
    E("e-t4", "s-trail", "Trail Maintenance Crew", "Bridge plank replacement — carpenters especially welcome.", "Miller Ridge Trailhead", at(9, 8), at(9, 12), 10, "private", trailCrew, false),
    E("e-f1", null, "Summer Fundraiser Setup", "Stage, tables, lighting and signage for the summer gala.", "Fairgrounds Pavilion", at(12, 16), at(12, 20), 12, "public", [], true),
  ];

  let ai = 0;
  const inOff = [4, 9, 2, 12, 6, 15];
  const outOff = [6, 3, 10, 5, 8, 4];
  const attendance: Attendance[] = [];
  const A = (eventId: string, memberId: string, walkIn = false, paid = 0) => {
    const ev = events.find((e) => e.id === eventId)!;
    attendance.push({
      id: `a-${++ai}`,
      eventId, memberId,
      checkIn: iso(new Date(new Date(ev.start).getTime() + inOff[ai % 6] * 60000)),
      checkOut: iso(new Date(new Date(ev.end).getTime() - outOff[ai % 6] * 60000)),
      walkIn, note: "",
      payment: paid > 0 ? { amount: paid, at: iso(new Date(new Date(ev.start).getTime() - 3 * 86400000)), receipt: rcptFor(eventId, memberId), method: "card" } : null,
    });
  };
  // history
  ["m-marcus", "m-noah"].forEach((m) => A("e-coat", m));
  ["m-marcus", "m-priya", "m-jordan", "m-elena", "m-sam", "m-noah"].forEach((m) => A("e-c1", m));
  ["m-priya", "m-elena"].forEach((m) => A("e-p1", m));
  ["m-marcus", "m-noah", "m-elena"].forEach((m) => A("e-t1", m));
  ["m-marcus", "m-priya", "m-jordan", "m-aisha"].forEach((m) => A("e-g1", m));
  ["m-priya", "m-elena"].forEach((m) => A("e-p2", m, m === "m-elena"));
  ["m-jordan", "m-aisha"].forEach((m) => A("e-m1", m));
  ["m-marcus", "m-elena"].forEach((m) => A("e-t2", m));
  ["m-marcus", "m-elena"].forEach((m) => A("e-saw", m, false, 35));
  ["m-marcus", "m-priya", "m-noah"].forEach((m) => A("e-c2", m));
  ["m-priya", "m-elena", "m-sam"].forEach((m) => A("e-p3", m));
  // live lunch: two checked-in, rest registered
  attendance.push({ id: `a-${++ai}`, eventId: "e-lunch", memberId: "m-marcus", checkIn: iso(new Date(now.getTime() - 40 * 60000)), checkOut: null, walkIn: false, note: "", payment: null });
  attendance.push({ id: `a-${++ai}`, eventId: "e-lunch", memberId: "m-priya", checkIn: iso(new Date(now.getTime() - 31 * 60000)), checkOut: null, walkIn: true, note: "", payment: null });
  ["m-jordan", "m-aisha", "m-sam", "m-grace"].forEach((m) =>
    attendance.push({ id: `a-${++ai}`, eventId: "e-lunch", memberId: m, checkIn: null, checkOut: null, walkIn: false, note: "", payment: null })
  );
  // upcoming registrations
  ["m-marcus", "m-elena"].forEach((m) => attendance.push({ id: `a-${++ai}`, eventId: "e-t3", memberId: m, checkIn: null, checkOut: null, walkIn: false, note: "", payment: null }));
  attendance.push({ id: `a-${++ai}`, eventId: "e-p4", memberId: "m-priya", checkIn: null, checkOut: null, walkIn: false, note: "", payment: null });
  ["m-jordan", "m-aisha"].forEach((m) => attendance.push({ id: `a-${++ai}`, eventId: "e-m2", memberId: m, checkIn: null, checkOut: null, walkIn: false, note: "", payment: null }));
  attendance.push({ id: `a-${++ai}`, eventId: "e-t4", memberId: "m-marcus", checkIn: null, checkOut: null, walkIn: false, note: "", payment: null });
  ["m-priya", "m-jordan", "m-sam", "m-grace", "m-elena", "m-marcus", "m-aisha"].forEach((m) =>
    attendance.push({ id: `a-${++ai}`, eventId: "e-f1", memberId: m, checkIn: null, checkOut: null, walkIn: false, note: "", payment: null })
  );
  // paid registration: WFA certification, fee settled at signup
  attendance.push({
    id: `a-${++ai}`, eventId: "e-wfa", memberId: "m-marcus", checkIn: null, checkOut: null, walkIn: false, note: "",
    payment: { amount: 45, at: iso(at(-2, 14)), receipt: rcptFor("e-wfa", "m-marcus"), method: "card" },
  });

  const t = (minsAgo: number) => iso(new Date(now.getTime() - minsAgo * 60000));
  const activity: Activity[] = [
    { id: uid(), at: t(6), kind: "walkin", text: "Priya Raman scanned the walk-in QR at Volunteer Appreciation Lunch" },
    { id: uid(), at: t(40), kind: "checkin", text: "Marcus Bell checked in to Volunteer Appreciation Lunch" },
    { id: uid(), at: t(95), kind: "email", text: "Confirmation email sent to grace.lin@gmail.com for Summer Fundraiser Setup" },
    { id: uid(), at: t(160), kind: "register", text: "Grace Lin registered for Summer Fundraiser Setup" },
    { id: uid(), at: t(60 * 26), kind: "medal", text: "Priya Raman unlocked the Trailblazer medal (15+ hours)" },
    { id: uid(), at: t(60 * 49), kind: "edit", text: "Dana Whitfield corrected check-out time for Sam Kowalski at Pantry Restock Night" },
    { id: uid(), at: t(60 * 75), kind: "system", text: "Weekly recurrence generated 3 Trail Maintenance Crew dates" },
    { id: uid(), at: t(60 * 30), kind: "payment", text: `Marcus Bell paid $45.00 for Wilderness First Aid Certification (${rcptFor("e-wfa", "m-marcus")})` },
    { id: uid(), at: t(60 * 24 * 3), kind: "payment", text: `Elena Vasquez paid $35.00 for Chainsaw Safety Certification (${rcptFor("e-saw", "m-elena")})` },
  ];

  const org: OrgSettings = {
    name: appConfig.orgName || "Riverbend Community Alliance",
    tagline: "Neighbors showing up for the river, the pantry, and each other.",
    mission: "Riverbend Community Alliance mobilizes volunteers across Marion County to restore public lands, fight food insecurity, and mentor the next generation — one shift at a time.",
    email: "hello@riverbend.org",
    phone: "(555) 014-2200",
    address: "214 Levee Road, Marion Falls, OR 97401",
    ein: "93-1204457",
    accent: "#E8A61A",
    logoDataUrl: null,
    logoMark: 0,
    waiver: {
      title: "Volunteer Release & Liability Waiver",
      body: "In consideration of being permitted to volunteer with Riverbend Community Alliance (the \"Alliance\"), I, the undersigned volunteer, knowingly and freely assume all risks associated with volunteer activities, including outdoor trail work, food handling, and event setup. I agree to follow all safety instructions given by Alliance staff and site leads, to use provided protective equipment, and to report injuries immediately.\n\nI release the Alliance, its officers, employees, and agents from any and all claims arising out of my participation, except where caused by gross negligence. I confirm that I am physically able to perform the duties of my chosen shift and that any minor I accompany is under my direct supervision.\n\nThis agreement remains in effect for all shifts until I revoke it in writing.",
      required: true,
    },
    tiers: [
      { name: "Seedling", hours: 5, color: TIER_COLORS[0] },
      { name: "Trailblazer", hours: 15, color: TIER_COLORS[1] },
      { name: "Beacon", hours: 25, color: TIER_COLORS[2] },
      { name: "Lighthouse", hours: 50, color: TIER_COLORS[3] },
    ],
    valuePerHour: 34.95,
    payments: { enabled: true, accountLabel: "Visa ending 4421" },
    smtp: {
      enabled: appConfig.smtp.host.length > 0,
      host: appConfig.smtp.host,
      port: Number(appConfig.smtp.port) || 587,
      user: appConfig.smtp.user,
      from: appConfig.smtp.from || appConfig.admin.email,
    },
  };
  if (appConfig.smtp.from) org.email = appConfig.smtp.from;

  const emails: EmailMsg[] = [
    { id: uid(), to: "grace.lin@gmail.com", subject: "Confirmed: Summer Fundraiser Setup", at: t(95), status: org.smtp.enabled ? "delivered" : "queued" },
    { id: uid(), to: "marcus.bell@gmail.com", subject: `Receipt ${rcptFor("e-wfa", "m-marcus")} — Wilderness First Aid Certification`, at: t(60 * 30), status: org.smtp.enabled ? "delivered" : "queued" },
    { id: uid(), to: "aisha.t@yahoo.com", subject: "Welcome to the team — set up your volunteer profile", at: t(60 * 24 * 74), status: org.smtp.enabled ? "delivered" : "queued" },
    { id: uid(), to: appConfig.admin.email, subject: "Your Volunteertrac workspace is ready", at: t(60 * 24 * 90), status: org.smtp.enabled ? "delivered" : "queued" },
  ];

  return { v: SEED_V, seededAt: iso(now), org, members, events, attendance, activity, emails, session: null };
}
