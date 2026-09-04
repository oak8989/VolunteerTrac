import { useMemo, useState } from "react";
import { useStore } from "../../lib/store";
import type { Member } from "../../lib/data";
import { downloadText, eventState, fmtDay, fmtTime, fullName, GROUPS, hoursOf, memberEvents, memberHours, memberLastActive, medalInfo, relTime, tierFor, toCSV } from "../../lib/data";
import { Avatar, Btn, card, Chip, Empty, Field, fmtH, Input, Modal, PageHead, Panel, Rosette, Seg, Select, Toggle } from "../../components/ui";
import { IcDown, IcEye, IcPencil, IcPlus, IcSearch, IcUsers } from "../../components/icons";

type Filter = "all" | "active" | "inactive";

export default function PeopleView() {
  const { db, updateMember, addMember } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const list = useMemo(() => {
    let l = [...db.members];
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      l = l.filter((m) => fullName(m).toLowerCase().includes(s) || m.email.toLowerCase().includes(s));
    }
    if (filter === "active") l = l.filter((m) => m.active);
    if (filter === "inactive") l = l.filter((m) => !m.active);
    return l.sort((a, b) => memberHours(db, b.id) - memberHours(db, a.id));
  }, [db, q, filter]);

  const exportCSV = () => {
    const rows: (string | number)[][] = [["Name", "Email", "Phone", "Role", "Groups", "Status", "Joined", "Events", "Hours", "Top medal"]];
    db.members.forEach((m) => {
      const t = tierFor(db.org.tiers, memberHours(db, m.id));
      rows.push([fullName(m), m.email, m.phone, m.role, m.groups.join("; "), m.active ? "active" : "inactive", new Date(m.joinedAt).toLocaleDateString(), memberEvents(db, m.id), memberHours(db, m.id), t ? t.name : "—"]);
    });
    downloadText("volunteertrac-members.csv", toCSV(rows));
  };

  const viewed = viewId ? db.members.find((m) => m.id === viewId) || null : null;

  return (
    <>
      <PageHead eyebrow="Promote admin efficiency" title="Members" sub="Edit profiles, review participation, flip admin rights, and export everything to CSV in one click.">
        <Btn variant="line" onClick={exportCSV}><IcDown size={15} /> Export CSV</Btn>
        <Btn onClick={() => setAdding(true)}><IcPlus size={15} /> Add member</Btn>
      </PageHead>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Seg<Filter> value={filter} onChange={setFilter} options={[{ id: "all", label: "All" }, { id: "active", label: "Active" }, { id: "inactive", label: "Inactive" }]} />
        <div className="relative ml-auto w-full sm:w-64">
          <IcSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <Input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      {list.length === 0 ? (
        <Empty icon={<IcUsers size={22} />} title="No members found" sub="Adjust the search, or add a new volunteer to get going." action={<Btn onClick={() => setAdding(true)}><IcPlus size={15} /> Add member</Btn>} />
      ) : (
        <div className={`${card} overflow-hidden anim-rise`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-[0.09em] text-faint border-b border-line bg-paper/60">
                  <th className="font-bold px-4 py-3">Member</th>
                  <th className="font-bold px-3 py-3">Groups</th>
                  <th className="font-bold px-3 py-3 text-right">Hours</th>
                  <th className="font-bold px-3 py-3 text-right hidden sm:table-cell">Events</th>
                  <th className="font-bold px-3 py-3 hidden lg:table-cell">Last active</th>
                  <th className="font-bold px-3 py-3">Medal</th>
                  <th className="font-bold px-3 py-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => {
                  const h = memberHours(db, m.id);
                  const tier = tierFor(db.org.tiers, h);
                  const last = memberLastActive(db, m.id);
                  return (
                    <tr key={m.id} className={`border-b border-line last:border-0 hover:bg-pine-900/3 transition-colors ${!m.active ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-3">
                          <Avatar name={fullName(m)} color={m.color} size={34} />
                          <span className="min-w-0">
                            <span className="font-semibold block truncate flex items-center gap-1.5">
                              {fullName(m)}
                              {m.role === "admin" && <Chip tone="ink">admin</Chip>}
                            </span>
                            <span className="text-[11.5px] text-faint font-mono truncate block">{m.email}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex flex-wrap gap-1">
                          {m.groups.map((g) => <Chip key={g} tone="pine">{g}</Chip>)}
                          {m.groups.length === 0 && <span className="text-faint text-[12px]">—</span>}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold tnum">{fmtH(h)}</td>
                      <td className="px-3 py-3 text-right font-mono tnum text-soft hidden sm:table-cell">{memberEvents(db, m.id)}</td>
                      <td className="px-3 py-3 font-mono text-[12px] text-soft hidden lg:table-cell">{last ? relTime(last) : "never"}</td>
                      <td className="px-3 py-3">{tier ? <span title={tier.name}><Rosette color={tier.color} size={24} /></span> : <span className="text-faint text-[12px]">—</span>}</td>
                      <td className="px-3 py-3">
                        <span className="flex justify-end gap-1">
                          <button title="View activity" onClick={() => setViewId(m.id)} className="p-1.5 rounded-lg text-soft hover:bg-pine-900/6 hover:text-ink transition cursor-pointer"><IcEye size={15} /></button>
                          <button title="Edit profile" onClick={() => setEditId(m.id)} className="p-1.5 rounded-lg text-soft hover:bg-pine-900/6 hover:text-ink transition cursor-pointer"><IcPencil size={15} /></button>
                          <button
                            title={m.active ? "Deactivate member" : "Reactivate member"}
                            onClick={() => updateMember(m.id, { active: !m.active })}
                            className={`h-7 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition cursor-pointer ${
                              m.active
                                ? "border-line text-soft hover:border-clay/40 hover:text-clay hover:bg-clay/8"
                                : "border-pine-200 text-pine-700 hover:bg-pine-100"
                            }`}
                          >
                            {m.active ? "Pause" : "Re-activate"}
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewed && <MemberPanel m={viewed} onClose={() => setViewId(null)} onEdit={() => { setEditId(viewed.id); }} />}
      {editId && <EditMemberModal m={db.members.find((m) => m.id === editId)!} onClose={() => setEditId(null)} />}
      <AddMemberModal open={adding} onClose={() => setAdding(false)} onAdd={addMember} />
    </>
  );
}

function MemberPanel({ m, onClose, onEdit }: { m: Member; onClose: () => void; onEdit: () => void }) {
  const { db } = useStore();
  const h = memberHours(db, m.id);
  const info = medalInfo(db.org.tiers, h);
  const recs = db.attendance
    .filter((a) => a.memberId === m.id)
    .map((a) => ({ a, e: db.events.find((e) => e.id === a.eventId) }))
    .filter((x) => x.e)
    .sort((x, y) => y.e!.start.localeCompare(x.e!.start));
  const upcoming = recs.filter((x) => eventState(x.e!) !== "past");
  const past = recs.filter((x) => eventState(x.e!) === "past");

  return (
    <Panel open onClose={onClose} title={fullName(m)} sub={`${m.email} · joined ${new Date(m.joinedAt).toLocaleDateString([], { month: "long", year: "numeric" })}`} w={500}
      footer={<Btn variant="line" onClick={() => { onEdit(); onClose(); }}><IcPencil size={14} /> Edit profile</Btn>}
    >
      <div className="flex items-center gap-4 mb-5">
        <Avatar name={fullName(m)} color={m.color} size={56} />
        <div>
          <p className="font-semibold text-[14px]">{m.title || "Volunteer"} {m.role === "admin" && <Chip tone="ink" className="ml-1">admin</Chip>}</p>
          <p className="text-[12px] text-soft font-mono">{m.phone} · {m.groups.join(", ") || "no groups"}</p>
          <p className="text-[12px] mt-1">{m.waiverSignedAt ? <Chip tone="pine">waiver signed</Chip> : <Chip tone="warn">waiver pending</Chip>}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { l: "Hours", v: fmtH(h) },
          { l: "Events", v: String(memberEvents(db, m.id)) },
          { l: "Medal", v: tierFor(db.org.tiers, h)?.name || "None" },
        ].map((s) => (
          <div key={s.l} className="bg-paper/80 border border-line rounded-[10px] px-3 py-2.5 text-center">
            <p className="font-display font-bold text-[17px] tnum">{s.v}</p>
            <p className="text-[10px] uppercase tracking-[0.1em] text-faint font-bold mt-0.5">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-soft mb-2">Medal case</p>
        <div className="flex items-center gap-3">
          {[...db.org.tiers].sort((a, b) => a.hours - b.hours).map((t) => {
            const got = h >= t.hours;
            return (
              <div key={t.name} className="flex flex-col items-center gap-1">
                <Rosette color={t.color} size={30} dim={!got} />
                <span className={`text-[10px] font-bold ${got ? "text-ink" : "text-faint"}`}>{t.name}</span>
                <span className="text-[9.5px] font-mono text-faint tnum">{t.hours}h</span>
              </div>
            );
          })}
        </div>
        {info.next && (
          <p className="text-[12px] text-soft mt-2.5">
            <span className="font-mono font-semibold text-ink tnum">{(info.next.hours - h).toFixed(1)}h</span> to {info.next.name}
          </p>
        )}
      </div>

      {upcoming.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-soft mb-2">Registered for</p>
          <div className="space-y-1.5">
            {upcoming.map(({ a, e }) => (
              <div key={a.id} className="flex items-center justify-between bg-paper/70 border border-line rounded-[9px] px-3 py-2">
                <span className="text-[13px] font-semibold truncate">{e!.title}</span>
                <span className="font-mono text-[11.5px] text-soft shrink-0 ml-3">{fmtDay(e!.start)} · {fmtTime(e!.start)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-soft mb-2">Participation history</p>
        {past.length === 0 ? (
          <p className="text-[12.5px] text-faint">No completed shifts yet.</p>
        ) : (
          <div className="space-y-1.5">
            {past.map(({ a, e }) => (
              <div key={a.id} className="flex items-center justify-between bg-paper/70 border border-line rounded-[9px] px-3 py-2">
                <span className="min-w-0">
                  <span className="text-[13px] font-semibold block truncate">{e!.title}</span>
                  <span className="font-mono text-[11px] text-faint">{fmtDay(e!.start)}{a.walkIn ? " · walk-in" : ""}</span>
                </span>
                <span className="font-mono text-[12.5px] font-bold tnum shrink-0 ml-3">{fmtH(hoursOf(a))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function EditMemberModal({ m, onClose }: { m: Member; onClose: () => void }) {
  const { updateMember } = useStore();
  const [f, setF] = useState({ firstName: m.firstName, lastName: m.lastName, email: m.email, phone: m.phone, title: m.title, role: m.role, active: m.active, groups: m.groups });
  const toggleG = (g: string) => setF((p) => ({ ...p, groups: p.groups.includes(g) ? p.groups.filter((x) => x !== g) : [...p.groups, g] }));
  return (
    <Modal open onClose={onClose} title="Edit profile" sub={m.email} w={480}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => { updateMember(m.id, f); onClose(); }}>Save changes</Btn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name"><Input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} /></Field>
        <Field label="Last name"><Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></Field>
        <Field label="Email" className="col-span-2"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Role">
          <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Member["role"] })}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        <div className="flex items-end pb-1.5">
          <Toggle on={f.active} onChange={(v) => setF({ ...f, active: v })} label={f.active ? "Active member" : "Inactive"} />
        </div>
        <div className="col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-soft mb-1.5">Groups</p>
          <div className="flex flex-wrap gap-1.5">
            {GROUPS.map((g) => (
              <button key={g} onClick={() => toggleG(g)}
                className={`h-7.5 px-3 rounded-full text-[12px] font-semibold border transition cursor-pointer ${f.groups.includes(g) ? "bg-pine-900 text-paper border-pine-900" : "border-linedark text-soft hover:border-pine-600"}`}
              >{g}</button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AddMemberModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (m: { firstName: string; lastName: string; email: string; phone: string; title: string; role: "admin" | "member"; groups: string[]; active: boolean }) => void }) {
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", title: "Volunteer", role: "member" as "admin" | "member", groups: [] as string[] });
  const [err, setErr] = useState("");
  const toggleG = (g: string) => setF((p) => ({ ...p, groups: p.groups.includes(g) ? p.groups.filter((x) => x !== g) : [...p.groups, g] }));
  const submit = () => {
    if (!f.firstName.trim() || !f.lastName.trim() || !f.email.includes("@")) return setErr("Name and a valid email are required.");
    setErr("");
    onAdd({ ...f, active: true });
    setF({ firstName: "", lastName: "", email: "", phone: "", title: "Volunteer", role: "member", groups: [] });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Add a member" sub="They'll receive an invitation email with a temporary password (simulated in this demo)." w={460}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={submit}><IcPlus size={14} /> Add & invite</Btn></>}
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name"><Input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} autoFocus /></Field>
        <Field label="Last name"><Input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} /></Field>
        <Field label="Email" className="col-span-2"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="name@example.org" /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Role">
          <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as "admin" | "member" })}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        <div className="col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-soft mb-1.5">Assign groups</p>
          <div className="flex flex-wrap gap-1.5">
            {GROUPS.map((g) => (
              <button key={g} onClick={() => toggleG(g)}
                className={`h-7.5 px-3 rounded-full text-[12px] font-semibold border transition cursor-pointer ${f.groups.includes(g) ? "bg-pine-900 text-paper border-pine-900" : "border-linedark text-soft hover:border-pine-600"}`}
              >{g}</button>
            ))}
          </div>
        </div>
        {err && <p className="col-span-2 text-[12.5px] font-semibold text-clay bg-clay/8 border border-clay/25 rounded-lg px-3 py-2">{err}</p>}
      </div>
    </Modal>
  );
}
