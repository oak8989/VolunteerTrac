import { useEffect, useState } from "react";
import type { EventItem, Payment } from "../lib/data";
import { fmtDayLong, fmtMoney, fmtTime, receiptId } from "../lib/data";
import { Btn, Field, Input, Modal } from "./ui";
import { IcCard, IcCheck, IcLock } from "./icons";

const digits = (s: string) => s.replace(/\D/g, "");

function fmtCardNum(s: string) {
  const d = digits(s).slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, "$1 ");
}
function fmtExp(s: string) {
  const d = digits(s).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}
function brand(d: string) {
  if (d.startsWith("4")) return "Visa";
  if (d.startsWith("5") || d.startsWith("2")) return "Mastercard";
  if (d.startsWith("3")) return "Amex";
  return "Card";
}

export default function PaymentModal({
  ev, email, onClose, onPaid,
}: { ev: EventItem; email: string; onClose: () => void; onPaid: (p: Payment) => void }) {
  const [stage, setStage] = useState<"form" | "processing" | "done">("form");
  const [name, setName] = useState("");
  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [err, setErr] = useState("");
  const [receipt, setReceipt] = useState("");
  const amount = ev.fee;

  useEffect(() => {
    if (stage !== "processing") return;
    const t = window.setTimeout(() => {
      const p: Payment = { amount, at: new Date().toISOString(), receipt: receiptId(), method: "card" };
      setReceipt(p.receipt);
      onPaid(p);
      setStage("done");
    }, 1600);
    return () => window.clearTimeout(t);
  }, [stage, amount, onPaid]);

  const pay = () => {
    const d = digits(num);
    if (name.trim().length < 2) return setErr("Enter the name on the card.");
    if (d.length < 15) return setErr("Card number looks too short.");
    const m = Number(exp.slice(0, 2));
    const y = Number(exp.slice(3, 5));
    if (!exp || m < 1 || m > 12 || exp.length < 5) return setErr("Expiry must be MM/YY.");
    const nowY = new Date().getFullYear() % 100;
    if (y < nowY || (y === nowY && m < new Date().getMonth() + 1)) return setErr("That card is expired.");
    if (digits(cvc).length < 3) return setErr("CVC is 3–4 digits.");
    setErr("");
    setStage("processing");
  };

  return (
    <Modal
      open
      onClose={stage === "processing" ? () => undefined : onClose}
      title={stage === "done" ? "Payment complete" : "Event registration fee"}
      sub={stage === "done" ? undefined : `${ev.title} · per person`}
      w={460}
      footer={
        stage === "form" ? (
          <>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn onClick={pay}><IcLock size={13} /> Pay {fmtMoney(amount)}</Btn>
          </>
        ) : stage === "processing" ? (
          <Btn disabled>
            <span className="inline-flex gap-1 items-center">Processing
              <span className="flex gap-0.5 ml-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1 h-1 rounded-full bg-current" style={{ animation: `pulseDot 0.9s ease-in-out ${i * 0.18}s infinite` }} />
                ))}
              </span>
            </span>
          </Btn>
        ) : (
          <Btn onClick={onClose}>Done</Btn>
        )
      }
    >
      {stage === "done" ? (
        <div className="py-4 flex flex-col items-center text-center anim-pop">
          <span className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--acc) 18%, white)", color: "var(--acc-deep)" }}>
            <IcCheck size={30} />
          </span>
          <p className="font-display text-[22px] font-bold mt-4">{fmtMoney(amount)} paid</p>
          <p className="font-mono text-[12.5px] text-pine-800 bg-pine-100 rounded-lg px-3 py-1.5 mt-2.5">{receipt}</p>
          <p className="text-[12.5px] text-soft mt-3 max-w-[300px]">
            A receipt and your event confirmation were emailed to <span className="font-semibold text-ink">{email}</span> (simulated).
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-[10px] border border-line bg-paper/80 px-4 py-3 mb-4">
            <div className="flex justify-between text-[13px]">
              <span className="font-semibold">{ev.title}</span>
              <span className="font-mono tnum">{fmtMoney(amount)}</span>
            </div>
            <p className="font-mono text-[11px] text-soft mt-1">
              {fmtDayLong(ev.start)} · {fmtTime(ev.start)} · 1 seat
            </p>
            <div className="flex justify-between text-[13px] font-bold mt-2 pt-2 border-t border-line">
              <span>Total due today</span>
              <span className="font-mono tnum" style={{ color: "var(--acc-deep)" }}>{fmtMoney(amount)}</span>
            </div>
          </div>

          <div className="space-y-3.5">
            <Field label="Name on card"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan A. Volunteer" autoFocus disabled={stage === "processing"} /></Field>
            <Field label="Card number">
              <div className="relative">
                <Input value={num} onChange={(e) => setNum(fmtCardNum(e.target.value))} placeholder="4242 4242 4242 4242" inputMode="numeric" disabled={stage === "processing"} className="pr-20 font-mono" />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-faint">
                  <IcCard size={15} className="text-pine-600" /> {brand(digits(num))}
                </span>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiry"><Input value={exp} onChange={(e) => setExp(fmtExp(e.target.value))} placeholder="MM/YY" inputMode="numeric" disabled={stage === "processing"} className="font-mono" /></Field>
              <Field label="CVC"><Input value={cvc} onChange={(e) => setCvc(digits(e.target.value).slice(0, 4))} placeholder="123" inputMode="numeric" disabled={stage === "processing"} className="font-mono" /></Field>
            </div>
            {err && <p className="text-[12.5px] font-semibold text-clay bg-clay/8 border border-clay/25 rounded-lg px-3 py-2">{err}</p>}
            <p className="text-[11px] text-faint flex items-center gap-1.5">
              <IcLock size={12} className="text-pine-600" /> Demo checkout — card is validated locally, nothing is charged. Cancelling a paid registration issues an automatic refund.
            </p>
          </div>
        </>
      )}
    </Modal>
  );
}
