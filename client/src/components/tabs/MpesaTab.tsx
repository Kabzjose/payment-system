import { useState,type  FormEvent } from "react";
import { useAuth } from "../../lib/auth";
import { api, type MpesaPayment, ApiError } from "../../lib/api";
import { useMpesaPolling } from "../../hooks/useMpesaPolling";
import { formatMpesaAmount, formatPhone, mpesaResultLabel } from "../../lib/format";
import { StatusPill } from "../Statuspill";

// ─── Waiting screen ───────────────────────────────────────────────────────────
// Shown after STK push is sent — polls status and shows feedback

function WaitingScreen({
  payment: initialPayment,
  onDone,
}: {
  payment: MpesaPayment;
  onDone: () => void;
}) {
  const { payment, polling, elapsed, stopPolling } = useMpesaPolling(initialPayment);
  const current = payment ?? initialPayment;

  const isTerminal = ["succeeded", "failed", "cancelled"].includes(current.status);

  return (
    <div className="max-w-md">
      <div className="rounded-lg border border-[#E5E2DA] bg-white p-6 space-y-5">

        {/* Amount + status header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[11px] text-[#8B8578] mb-1">Amount</div>
            <div className="font-serif text-2xl text-[#0E1116]">
              {formatMpesaAmount(current.amount)}
            </div>
          </div>
          <StatusPill status={current.status} />
        </div>

        <div className="border-t border-[#E5E2DA]" />

        {/* Phone */}
        <div className="flex justify-between text-[13px]">
          <span className="text-[#8B8578] font-mono">Phone</span>
          <span className="font-mono text-[#0E1116]">
            {formatPhone(current.phone_number)}
          </span>
        </div>

        {/* Dynamic status message */}
        {current.status === "processing" && polling && (
          <div className="bg-[#fffbeb] border border-[#fcd34d]/40 rounded-lg p-4 text-center space-y-2">
            <div className="text-2xl">📲</div>
            <p className="text-[13px] font-medium text-[#9C7A1F]">
              Check your phone
            </p>
            <p className="text-[12px] text-[#8B8578]">
              Enter your M-Pesa PIN to complete this payment
            </p>
            <p className="text-[11px] font-mono text-[#8B8578]">
              Waiting... {elapsed}s
            </p>
          </div>
        )}

        {current.status === "succeeded" && (
          <div className="bg-[#dcfce7] border border-[#86efac]/40 rounded-lg p-4 text-center space-y-2">
            <div className="text-2xl">✅</div>
            <p className="text-[13px] font-medium text-[#2D6A4F]">
              Payment confirmed
            </p>
            {current.mpesa_receipt_number && (
              <p className="text-[11px] font-mono text-[#2D6A4F]">
                Receipt: {current.mpesa_receipt_number}
              </p>
            )}
          </div>
        )}

        {(current.status === "failed" || current.status === "cancelled") && (
          <div className="bg-[#fee2e2] border border-[#fca5a5]/40 rounded-lg p-4 text-center space-y-2">
            <div className="text-2xl">
              {current.status === "cancelled" ? "❌" : "⚠️"}
            </div>
            <p className="text-[13px] font-medium text-[#C9402E]">
              {current.status === "cancelled" ? "Payment cancelled" : "Payment failed"}
            </p>
            <p className="text-[11px] font-mono text-[#8B8578]">
              {mpesaResultLabel(current.result_code)}
            </p>
          </div>
        )}

        {/* Polling timed out but no terminal status yet */}
        {current.status === "processing" && !polling && (
          <div className="bg-[#f8fafc] border border-[#E5E2DA] rounded-lg p-4 text-center space-y-2">
            <p className="text-[13px] text-[#8B8578]">
              Still waiting for confirmation from Safaricom.
            </p>
            <p className="text-[11px] font-mono text-[#8B8578]">
              Check your payment history for the final status.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {isTerminal ? (
            <button
              onClick={onDone}
              className="flex-1 py-2.5 rounded-md bg-[#0E1116] text-[#F7F5F0] text-[13px] font-medium hover:bg-[#1a1f28] transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={() => { stopPolling(); onDone(); }}
                className="flex-1 py-2.5 rounded-md border border-[#D9D5CC] text-[#6B665C] text-[13px] hover:bg-[#F7F5F0] transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={onDone}
                className="flex-1 py-2.5 rounded-md bg-[#0E1116] text-[#F7F5F0] text-[13px] font-medium hover:bg-[#1a1f28] transition-colors"
              >
                View history
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STK Push form ────────────────────────────────────────────────────────────

export function MpesaTab({ onSuccess }: { onSuccess: () => void }) {
  const { token } = useAuth();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("100");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Once STK push is sent, we store the payment here
  // and switch to the WaitingScreen
  const [pendingPayment, setPendingPayment] = useState<MpesaPayment | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt < 1) {
      setError("Minimum amount is KES 1");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payment = await api.initiateMpesa(token, {
        phone,
        amount: amt,
        account_reference: "Payment",
        description: "Payment",
      });

      // Switch to waiting screen — polling starts automatically
      setPendingPayment(payment);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to initiate payment");
    } finally {
      setSubmitting(false);
    }
  }

  // User dismissed or payment completed — reset form
  function handleDone() {
    setPendingPayment(null);
    setPhone("");
    setAmount("100");
    onSuccess(); // refresh history
  }

  // Show waiting screen if STK push was sent
  if (pendingPayment) {
    return <WaitingScreen payment={pendingPayment} onDone={handleDone} />;
  }

  return (
    <div className="max-w-md">
      <p className="text-[13px] text-[#8B8578] mb-6">
        Pay with M-Pesa. A prompt will be sent to your phone — enter your
        PIN to complete the payment.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[12px] font-mono text-[#6B665C] mb-1.5">
            Phone number
          </label>
          <input
            type="tel"
            required
            placeholder="0712 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md border border-[#D9D5CC] bg-white font-mono text-[14px] focus:outline-none focus:ring-2 focus:ring-[#E8C170]/40 focus:border-[#E8C170]"
          />
          <p className="mt-1 text-[11px] font-mono text-[#8B8578]">
            Safaricom number registered with M-Pesa
          </p>
        </div>

        <div>
          <label className="block text-[12px] font-mono text-[#6B665C] mb-1.5">
            Amount (KES)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-[#8B8578]">
              KES
            </span>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-12 pr-3 py-2.5 rounded-md border border-[#D9D5CC] bg-white font-serif text-lg focus:outline-none focus:ring-2 focus:ring-[#E8C170]/40 focus:border-[#E8C170]"
            />
          </div>
        </div>

        {error && (
          <div className="text-[13px] text-[#C9402E] bg-[#C9402E]/8 border border-[#C9402E]/20 rounded-md px-3 py-2.5">
            ✗ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-md bg-[#0E1116] text-[#F7F5F0] text-[14px] font-medium hover:bg-[#1a1f28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Sending prompt..." : `Send KES ${amount || "0"} prompt`}
        </button>
      </form>
    </div>
  );
}