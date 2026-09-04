import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { IcX } from "./icons";

export const card = "bg-panel border border-line rounded-xl";

/* ---------- buttons ---------- */
type BtnVariant = "acc" | "dark" | "line" | "ghost" | "danger" | "soft";
export function Btn({
  variant = "acc", size = "md", className = "", children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  const v: Record<BtnVariant, string> = {
    acc: "bg-[var(--acc)] text-[var(--acc-ink)] hover:brightness-[1.07] shadow-[0_1px_2px_rgba(20,30,25,.18)]",
    dark: "bg-pine-900 text-paper hover:bg-pine-800",
    line: "border border-linedark bg-panel text-ink hover:border-pine-600 hover:text-pine-800",
    ghost: "text-soft hover:bg-pine-900/5 hover:text-ink",
    danger: "bg-clay text-[#fdf3ec] hover:brightness-105",
    soft: "bg-pine-100 text-pine-800 hover:bg-pine-200",
  };
  const s = { sm: "h-8 px-3 text-xs", md: "h-9 px-3.5 text-[13px]", lg: "h-11 px-5 text-sm" };
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-semibold rounded-[9px] transition-all duration-150 active:scale-[.97] disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap cursor-pointer ${v[variant]} ${s[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------- chips ---------- */
type Tone = "pine" | "acc" | "gold" | "line" | "ink" | "warn" | "live";
export function Chip({ tone = "line", className = "", children }: { tone?: Tone; className?: string; children: ReactNode }) {
  const t: Record<Tone, string> = {
    pine: "bg-pine-100 text-pine-800",
    gold: "bg-[color-mix(in_srgb,#e3a93c_18%,white)] text-[#8a6410]",
    line: "border border-linedark bg-white/60 text-soft",
    ink: "bg-pine-900 text-paper",
    warn: "bg-[color-mix(in_srgb,#b8432a_12%,white)] text-clay",
    live: "bg-pine-900 text-[#ffd98a]",
    acc: "",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[21px] px-2 rounded-full text-[10px] font-bold uppercase tracking-[0.07em] ${t[tone]} ${className}`}
      style={tone === "acc" ? { background: "color-mix(in srgb, var(--acc) 17%, white)", color: "var(--acc-deep)" } : undefined}
    >
      {children}
    </span>
  );
}

export function LiveDot() {
  return <span className="dot-live inline-block w-1.5 h-1.5 rounded-full bg-[var(--acc)]" />;
}

/* ---------- modal / panel ---------- */
export function Modal({
  open, onClose, title, sub, children, footer, w = 540,
}: { open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode; footer?: ReactNode; w?: number }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-5">
      <div className="absolute inset-0 bg-pine-950/55" onClick={onClose} />
      <div className="relative w-full anim-pop bg-panel rounded-t-2xl sm:rounded-xl border border-line shadow-2xl max-h-[90vh] flex flex-col" style={{ maxWidth: w }}>
        <div className="flex items-start justify-between gap-4 px-5 pt-4.5 pb-3.5 border-b border-line">
          <div>
            <h3 className="font-display text-[17px] font-bold leading-tight">{title}</h3>
            {sub && <p className="text-xs text-soft mt-0.5">{sub}</p>}
          </div>
          <button onClick={onClose} className="mt-0.5 p-1.5 rounded-lg text-soft hover:bg-pine-900/5 hover:text-ink transition cursor-pointer" aria-label="Close">
            <IcX size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 grow">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-line flex flex-wrap justify-end gap-2 bg-paper/70 rounded-b-2xl sm:rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Panel({
  open, onClose, title, sub, children, footer, w = 470,
}: { open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode; footer?: ReactNode; w?: number }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-pine-950/45" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full bg-panel border-l border-line shadow-2xl anim-slideL flex flex-col" style={{ maxWidth: w }}>
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-line">
          <div>
            <h3 className="font-display text-lg font-bold leading-tight">{title}</h3>
            {sub && <p className="text-xs text-soft mt-0.5">{sub}</p>}
          </div>
          <button onClick={onClose} className="mt-0.5 p-1.5 rounded-lg text-soft hover:bg-pine-900/5 hover:text-ink transition cursor-pointer" aria-label="Close">
            <IcX size={16} />
          </button>
        </div>
        <div className="overflow-y-auto grow px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-line flex justify-end gap-2 bg-paper/70">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({
  open, onClose, onYes, title, body, yesLabel = "Delete",
}: { open: boolean; onClose: () => void; onYes: () => void; title: string; body: string; yesLabel?: string }) {
  return (
    <Modal open={open} onClose={onClose} title={title} w={430}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="danger" onClick={() => { onYes(); onClose(); }}>{yesLabel}</Btn>
        </>
      }
    >
      <p className="text-[13.5px] text-soft leading-relaxed">{body}</p>
    </Modal>
  );
}

/* ---------- form ---------- */
export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-soft mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-faint mt-1">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full h-9.5 px-3 rounded-[9px] border border-linedark bg-white/75 text-[13.5px] text-ink outline-none transition placeholder:text-faint focus:border-[var(--acc)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--acc)_22%,transparent)]";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} h-auto min-h-[84px] py-2.5 leading-relaxed ${props.className || ""}`} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} cursor-pointer ${props.className || ""}`} />;
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-2.5 cursor-pointer group"
      role="switch"
      aria-checked={on}
    >
      <span className={`relative w-9.5 h-5.5 rounded-full transition-colors duration-200 ${on ? "bg-pine-700" : "bg-linedark"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-4" : ""}`} />
      </span>
      {label && <span className="text-[13px] font-medium text-ink group-hover:text-pine-800 transition">{label}</span>}
    </button>
  );
}

/* ---------- identity ---------- */
export function Avatar({ name, color, size = 34, className = "" }: { name: string; color: string; size?: number; className?: string }) {
  const ini = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white shrink-0 ${className}`}
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {ini}
    </span>
  );
}

export function Rosette({ color, size = 26, dim = false, className = "" }: { color: string; size?: number; dim?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={{ opacity: dim ? 0.35 : 1, filter: dim ? "grayscale(1)" : undefined }} aria-hidden="true">
      <path d="M8.7 13.4L6.4 21l3.9-1.9 1.7 2.1 1.7-2.1 3.9 1.9-2.3-7.6" fill={color} opacity=".75" />
      <circle cx="12" cy="8.6" r="6" fill={color} />
      <circle cx="12" cy="8.6" r="4.1" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1.1" />
      <path d="M12 6.2l.75 1.55 1.7.22-1.24 1.18.32 1.68L12 10.05l-1.53.78.32-1.68-1.24-1.18 1.7-.22z" fill="rgba(255,255,255,.92)" />
    </svg>
  );
}

/* ---------- data viz ---------- */
export function Bar({ value, tone, className = "" }: { value: number; tone?: string; className?: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setW(Math.min(1, Math.max(0, value))), 80);
    return () => window.clearTimeout(t);
  }, [value]);
  return (
    <div className={`h-1.5 rounded-full bg-line overflow-hidden ${className}`}>
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${w * 100}%`, background: tone || "var(--acc)" }} />
    </div>
  );
}

export function Ring({ value, size = 132, stroke = 11, tone = "var(--acc)", children }: { value: number; size?: number; stroke?: number; tone?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setV(Math.min(1, Math.max(0, value))), 120);
    return () => window.clearTimeout(t);
  }, [value]);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

export function Spark({ data, w = 230, h = 58, tone = "var(--acc)" }: { data: number[]; w?: number; h?: number; tone?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => [ (i / (data.length - 1)) * (w - 4) + 2, h - 4 - (v / max) * (h - 12) ]);
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `M${pts[0][0]},${h - 2} L` + pts.map((p) => p.join(",")).join(" L") + ` L${pts[pts.length - 1][0]},${h - 2} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: h }} aria-hidden="true">
      <path d={area} fill={tone} opacity="0.13" />
      <polyline points={line} fill="none" stroke={tone} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.4" fill={tone} stroke="var(--color-panel)" strokeWidth="1.6" />
    </svg>
  );
}

export function Bars({ data, height = 170, activeIndex }: { data: { label: string; value: number }[]; height?: number; activeIndex?: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 60);
    return () => window.clearTimeout(t);
  }, []);
  const max = Math.max(1, ...data.map((d) => d.value));
  const ai = activeIndex === undefined ? data.length - 1 : activeIndex;
  return (
    <div className="flex items-end gap-2.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1.5 group">
          <span className="text-[10.5px] font-mono tnum text-soft opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {d.value}h
          </span>
          <div
            className="w-full max-w-[46px] rounded-t-[5px] transition-all duration-700 ease-out"
            style={{
              height: on ? `${Math.max(2, (d.value / max) * (height - 52))}px` : "2px",
              transitionDelay: `${i * 45}ms`,
              background: i === ai ? "var(--acc)" : "var(--color-pine-200)",
            }}
          />
          <span className={`text-[10px] font-semibold ${i === ai ? "text-ink" : "text-faint"}`}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- misc ---------- */
export function Empty({ icon, title, sub, action }: { icon: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-linedark rounded-xl bg-panel/60 px-6 py-12 text-center flex flex-col items-center">
      <div className="w-12 h-12 rounded-full bg-pine-100 text-pine-700 flex items-center justify-center mb-3">{icon}</div>
      <p className="font-display font-bold text-[15px]">{title}</p>
      {sub && <p className="text-[13px] text-soft mt-1 max-w-[340px]">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Seg<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 bg-pine-900/6 rounded-[10px] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`h-7 px-3 rounded-[7px] text-xs font-semibold transition-all cursor-pointer ${value === o.id ? "bg-panel text-ink shadow-sm" : "text-soft hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Clock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(i);
  }, []);
  return (
    <span className={`font-mono tnum ${className}`}>
      {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

export function useCountUp(target: number, dur = 950) {
  const [v, setV] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, dur]);
  return v;
}

export function PageHead({ eyebrow, title, sub, children }: { eyebrow?: string; title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: "var(--acc-deep)" }}>
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[26px] sm:text-[30px] font-bold leading-[1.08] tracking-tight">{title}</h1>
        {sub && <p className="text-[13.5px] text-soft mt-1.5 max-w-[560px]">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}

export const fmtH = (h: number) => `${h % 1 === 0 ? h.toFixed(0) : h.toFixed(1)}h`;
