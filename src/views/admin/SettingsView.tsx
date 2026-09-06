import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useStore } from "../../lib/store";
import type { OrgSettings } from "../../lib/data";
import { ACCENTS, downloadText, relTime } from "../../lib/data";
import { Btn, card, Chip, Field, Input, PageHead, Textarea, Toggle } from "../../components/ui";
import { IcCard, IcCheck, IcDown, IcMail, IcShield, LogoMark } from "../../components/icons";

export default function SettingsView() {
  const { db, saveOrg, toast, testEmail } = useStore();
  const [form, setForm] = useState<OrgSettings>(() => ({
    ...db.org,
    waiver: { ...db.org.waiver },
    tiers: db.org.tiers.map((t) => ({ ...t })),
    payments: { ...db.org.payments },
    smtp: { ...db.org.smtp },
  }));
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(db.org);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setForm((p) => ({ ...p, logoDataUrl: String(r.result) }));
    r.readAsDataURL(f);
  };

  const save = () => {
    saveOrg(form);
    toast("ok", "Settings saved", "Branding, waivers and award thresholds updated across the app");
  };

  return (
    <>
      <PageHead eyebrow="Emphasize your mission" title="Organization settings" sub="White-label the platform, manage your waiver, tune award thresholds and keep org details current.">
        <Btn variant="line" onClick={() => downloadText("volunteertrac-data.json", JSON.stringify(db, null, 2), "application/json")}>
          <IcDown size={15} /> Export data
        </Btn>
        <Btn onClick={save} disabled={!dirty}>{dirty ? "Save changes" : "All changes saved"}</Btn>
      </PageHead>

      <div className="grid grid-cols-12 gap-4">
        {/* branding */}
        <section className={`${card} col-span-12 lg:col-span-7 p-5 anim-rise`}>
          <h2 className="font-display font-bold text-[16px] mb-4">Brand & white-label</h2>
          <div className="flex items-center gap-4 mb-5">
            {form.logoDataUrl ? (
              <img src={form.logoDataUrl} alt="logo" className="w-14 h-14 rounded-[12px] object-cover border border-line" />
            ) : (
              <LogoMark variant={form.logoMark} size={56} />
            )}
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <button key={i} onClick={() => setForm((p) => ({ ...p, logoMark: i, logoDataUrl: null }))}
                    className={`p-1 rounded-[10px] border transition cursor-pointer ${!form.logoDataUrl && form.logoMark === i ? "border-[var(--acc)] bg-[color-mix(in_srgb,var(--acc)_10%,white)]" : "border-line hover:border-faint"}`}
                  >
                    <LogoMark variant={i} size={30} />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Btn size="sm" variant="line" onClick={() => fileRef.current?.click()}>Upload logo</Btn>
                {form.logoDataUrl && <Btn size="sm" variant="ghost" onClick={() => setForm((p) => ({ ...p, logoDataUrl: null }))}>Remove</Btn>}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Organization name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="EIN"><Input value={form.ein} onChange={(e) => setForm({ ...form, ein: e.target.value })} /></Field>
            <Field label="Tagline" className="sm:col-span-2"><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></Field>
            <Field label="Mission statement" className="sm:col-span-2"><Textarea value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} /></Field>
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-soft mb-2">Theme accent</p>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <button key={a.hex} onClick={() => setForm((p) => ({ ...p, accent: a.hex }))}
                  className={`flex items-center gap-2 h-9 px-3 rounded-[9px] border text-[12.5px] font-semibold transition cursor-pointer ${form.accent === a.hex ? "border-pine-800 bg-pine-900 text-paper" : "border-linedark bg-white/60 text-ink hover:border-faint"}`}
                >
                  <span className="w-4 h-4 rounded-full border border-black/10" style={{ background: a.hex }} />
                  {a.name}
                  {form.accent === a.hex && <IcCheck size={13} />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-[10px] border border-dashed border-linedark bg-paper/70 p-4">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-faint mb-2.5">Live preview</p>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Btn variant="acc" size="sm">Register</Btn>
              <Btn variant="dark" size="sm">Check out</Btn>
              <Chip tone="acc">Public</Chip>
              <Chip tone="live">live</Chip>
              <span className="font-mono text-[12px] text-soft tnum">128h logged</span>
            </div>
          </div>
        </section>

        <div className="col-span-12 lg:col-span-5 space-y-4">
          {/* waiver */}
          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "80ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-[16px] flex items-center gap-2"><IcShield size={17} className="text-pine-700" /> Waiver</h2>
              <Toggle on={form.waiver.required} onChange={(v) => setForm((p) => ({ ...p, waiver: { ...p.waiver, required: v } }))} label={form.waiver.required ? "Required" : "Optional"} />
            </div>
            <div className="space-y-3.5">
              <Field label="Waiver title"><Input value={form.waiver.title} onChange={(e) => setForm((p) => ({ ...p, waiver: { ...p.waiver, title: e.target.value } }))} /></Field>
              <Field label="Waiver body" hint="Members must accept this before registering for waiver-gated events.">
                <Textarea rows={7} value={form.waiver.body} onChange={(e) => setForm((p) => ({ ...p, waiver: { ...p.waiver, body: e.target.value } }))} />
              </Field>
            </div>
          </section>

          {/* payments */}
          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "120ms" }}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display font-bold text-[16px] flex items-center gap-2">
                <IcCard size={17} className="text-pine-700" /> Event payments
              </h2>
              <Toggle on={form.payments.enabled} onChange={(v) => setForm((p) => ({ ...p, payments: { ...p.payments, enabled: v } }))} label={form.payments.enabled ? "Accepting" : "Disabled"} />
            </div>
            <p className="text-[12px] text-soft mb-4">
              Charge a per-person fee on trainings and ticketed events. Members pay at registration and get an emailed receipt; cancelling refunds automatically.
            </p>
            <Field label="Payout account label" hint="Shown on receipts and in the ledger.">
              <Input value={form.payments.accountLabel} disabled={!form.payments.enabled} onChange={(e) => setForm((p) => ({ ...p, payments: { ...p.payments, accountLabel: e.target.value } }))} className={!form.payments.enabled ? "opacity-55" : ""} />
            </Field>
            {form.payments.enabled && (
              <p className="text-[11.5px] font-mono text-pine-800 bg-pine-100/70 rounded-lg px-3 py-2 mt-3">
                Set fees per event under Events → New event.
              </p>
            )}
          </section>

          {/* awards */}
          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "160ms" }}>
            <h2 className="font-display font-bold text-[16px] mb-1">Award thresholds</h2>
            <p className="text-[12px] text-soft mb-4">Hours at which each medal unlocks. Existing volunteers re-qualify instantly.</p>
            <div className="space-y-2.5">
              {form.tiers.map((t, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ background: t.color }} />
                  <Input value={t.name} onChange={(e) => { const tiers = form.tiers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)); setForm({ ...form, tiers }); }} className="flex-1" />
                  <div className="relative w-24 shrink-0">
                    <Input type="number" min={1} value={t.hours}
                      onChange={(e) => { const tiers = form.tiers.map((x, j) => (j === i ? { ...x, hours: Math.max(1, Number(e.target.value)) } : x)); setForm({ ...form, tiers }); }}
                      className="pr-7 text-right font-mono"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-faint">h</span>
                  </div>
                </div>
              ))}
            </div>
            <Field label="Volunteer hour value ($)" hint="Used for the estimated community-value figure. Independent Sector's benchmark is ≈ $34.95." className="mt-4">
              <Input type="number" min={0} step={0.05} value={form.valuePerHour} onChange={(e) => setForm({ ...form, valuePerHour: Number(e.target.value) })} className="font-mono" />
            </Field>
          </section>

          {/* org info */}
          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "240ms" }}>
            <h2 className="font-display font-bold text-[16px] mb-4">Organization info</h2>
            <div className="space-y-3.5">
              <Field label="Contact email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            </div>
          </section>

          {/* email server */}
          <section className={`${card} p-5 anim-rise`} style={{ animationDelay: "320ms" }}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display font-bold text-[16px] flex items-center gap-2">
                <IcMail size={17} className="text-pine-700" /> Email server
              </h2>
              <Toggle on={form.smtp.enabled} onChange={(v) => setForm((p) => ({ ...p, smtp: { ...p.smtp, enabled: v } }))} label={form.smtp.enabled ? "Connected" : "Queuing locally"} />
            </div>
            <p className="text-[12px] text-soft mb-4">
              SMTP settings for confirmations, receipts and reset links. Prefilled from <span className="font-mono">SMTP_*</span> in your docker-compose. Without a host, mail queues in the outbox below.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Host" className="col-span-2"><Input value={form.smtp.host} placeholder="smtp.example.org" onChange={(e) => setForm((p) => ({ ...p, smtp: { ...p.smtp, host: e.target.value } }))} className="font-mono" /></Field>
              <Field label="Port"><Input type="number" value={form.smtp.port} onChange={(e) => setForm((p) => ({ ...p, smtp: { ...p.smtp, port: Number(e.target.value) } }))} className="font-mono" /></Field>
              <Field label="Username" className="col-span-2"><Input value={form.smtp.user} placeholder="apikey" onChange={(e) => setForm((p) => ({ ...p, smtp: { ...p.smtp, user: e.target.value } }))} className="font-mono" /></Field>
              <Field label="From address"><Input type="email" value={form.smtp.from} onChange={(e) => setForm((p) => ({ ...p, smtp: { ...p.smtp, from: e.target.value } }))} className="font-mono" /></Field>
            </div>
            <div className="flex gap-2 mt-4">
              <Btn variant="line" size="sm" onClick={testEmail}><IcMail size={13} /> Send test email</Btn>
            </div>

            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-faint mt-5 mb-2">Outbox · last {Math.min(db.emails.length, 6)} of {db.emails.length}</p>
            {db.emails.length === 0 ? (
              <p className="text-[12.5px] text-faint">Nothing sent yet — registrations and receipts will appear here.</p>
            ) : (
              <div className="divide-y divide-line border border-line rounded-[10px] overflow-hidden">
                {db.emails.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-3.5 py-2.5 bg-white/50">
                    <IcMail size={14} className="text-faint shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold truncate">{m.subject}</p>
                      <p className="text-[10.5px] font-mono text-faint truncate">to {m.to} · {relTime(m.at)}</p>
                    </div>
                    <Chip tone={m.status === "delivered" ? "pine" : "warn"}>{m.status === "delivered" ? "delivered" : "queued"}</Chip>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
