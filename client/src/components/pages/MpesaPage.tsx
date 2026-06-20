import { useState, type FormEvent } from "react";
import { useAuth } from "../../lib/auth";
import { api, type MpesaPayment, ApiError } from "../../lib/api";
import { useMpesaPolling } from "../../hooks/useMpesaPolling";
import { formatMpesaAmount, formatPhone, mpesaResultLabel } from "../../lib/format";
import { StatusBadge } from "../ui/StatusBadge";

function WaitingScreen({ payment: initialPayment, onDone }: { payment: MpesaPayment; onDone: () => void }) {
  const { payment, polling, elapsed, stopPolling } = useMpesaPolling(initialPayment);
  const current = payment ?? initialPayment;
  const isTerminal = ["succeeded", "failed", "cancelled"].includes(current.status);

  return (
    <div className="max-w-md mx-auto fade-in">
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Amount</p>
            <p className="text-2xl font-mono font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{formatMpesaAmount(current.amount)}</p>
          </div>
          <StatusBadge status={current.status} />
        </div>
        <div className="flex justify-between items-center px-6 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Phone</span>
          <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{formatPhone(current.phone_number)}</span>
        </div>
        <div className="p-6">
          {current.status === "processing" && polling && (
            <div className="rounded-xl p-5 text-center space-y-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div className="text-3xl">📲</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#FCD34D" }}>Check your phone</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Enter your M-Pesa PIN to complete this payment</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: "#F59E0B" }} />
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Waiting... {elapsed}s</span>
              </div>
            </div>
          )}
          {current.status === "succeeded" && (
            <div className="rounded-xl p-5 text-center space-y-2" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div className="text-3xl">✅</div>
              <p className="text-sm font-semibold" style={{ color: "#34D399" }}>Payment confirmed</p>
              {current.mpesa_receipt_number && <p className="text-xs font-mono" style={{ color: "#10B981" }}>Receipt: {current.mpesa_receipt_number}</p>}
            </div>
          )}
          {(current.status === "failed" || current.status === "cancelled") && (
            <div className="rounded-xl p-5 text-center space-y-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div className="text-3xl">{current.status === "cancelled" ? "❌" : "⚠️"}</div>
              <p className="text-sm font-semibold" style={{ color: "#F87171" }}>{current.status === "cancelled" ? "Payment cancelled" : "Payment failed"}</p>
              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{mpesaResultLabel(current.result_code)}</p>
            </div>
          )}
          {current.status === "processing" && !polling && (
            <div className="rounded-xl p-5 text-center" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Still waiting for confirmation from Safaricom.</p>
              <p className="text-xs font-mono mt-1" style={{ color: "var(--text-label)" }}>Check your payment history for the final status.</p>
            </div>
          )}
          <div className="flex gap-3 mt-4">
            {isTerminal ? <button onClick={onDone} className="btn-primary flex-1">Done</button> : (
              <>
                <button onClick={() => { stopPolling(); onDone(); }} className="btn-secondary flex-1">Dismiss</button>
                <button onClick={onDone} className="btn-primary flex-1">View history</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MpesaPage({ onSuccess }: { onSuccess: () => void }) {
  const { token } = useAuth();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("100");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<MpesaPayment | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt < 1) { setError("Minimum amount is KES 1"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const payment = await api.initiateMpesa(token, { phone, amount: amt, account_reference: "Payment", description: "Payment" });
      setPendingPayment(payment);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to initiate payment");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDone() { setPendingPayment(null); setPhone(""); setAmount("100"); onSuccess(); }

  if (pendingPayment) return <WaitingScreen payment={pendingPayment} onDone={handleDone} />;

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>M-Pesa Payment</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Send an STK push to your Safaricom number</p>
      </div>
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div className="rounded-xl p-6 lg:p-8" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: "rgba(16,185,129,0.12)" }}>📱</div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>M-Pesa STK Push</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Safaricom mobile money</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="mpesa-phone" className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Phone Number</label>
              <input id="mpesa-phone" type="tel" required placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-base font-mono text-base" />
              <p className="mt-1.5 text-[11px] font-mono" style={{ color: "var(--text-label)" }}>Safaricom number registered with M-Pesa</p>
            </div>
            <div>
              <label htmlFor="mpesa-amount" className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Amount (KES)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold" style={{ color: "var(--text-muted)" }}>KES</span>
                <input id="mpesa-amount" type="number" required min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-base pl-12 text-lg font-mono" />
              </div>
            </div>
            {error && (
              <div className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm slide-up"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>
                <span>✗</span><span>{error}</span>
              </div>
            )}
            <button type="submit" id="mpesa-submit" disabled={submitting} className="btn-primary w-full py-3 text-sm"
              style={{ background: "linear-gradient(135deg, #059669, #10B981)" }}>
              {submitting
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending prompt...</span>
                : `Send KES ${amount || "0"} prompt`}
            </button>
          </form>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "#34D399" }}>How it works</p>
            <ol className="space-y-2.5">
              {["Enter your M-Pesa number and amount", "A prompt is sent to your phone", "Enter your M-Pesa PIN to confirm", "Payment is processed by Safaricom"].map((s, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5"
                    style={{ background: "rgba(16,185,129,0.12)", color: "#34D399" }}>{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-xl p-5" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "#34D399" }}>Instant confirmation</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Payments are confirmed in real-time via Safaricom's callback system.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
