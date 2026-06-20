import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { api, type StripePaymentWithTransactions, ApiError } from "../../lib/api";
import { formatStripeAmount, formatDate, transactionLabel } from "../../lib/format";
import { StatusBadge } from "../ui/StatusBadge";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";
import { Modal, ModalHeader } from "../ui/Modal";

const CardBadge = () => (
  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
    style={{ background: "rgba(99,102,241,0.12)", color: "#818CF8" }}>CARD</span>
);

export function StripeDetail({ paymentId, onClose, onRefunded }: { paymentId: string; onClose: () => void; onRefunded: () => void }) {
  const { token } = useAuth();
  const [payment, setPayment] = useState<StripePaymentWithTransactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.getStripePayment(token, paymentId).then(setPayment)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token, paymentId]);

  const refundedTotal = payment?.transactions
    .filter(t => (t.type === "refund" || t.type === "partial_refund") && t.status === "succeeded")
    .reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const canRefund = payment?.status === "succeeded" && refundedTotal < payment.amount;

  async function handleRefund() {
    if (!token || !payment) return;
    setRefunding(true); setError(null);
    try {
      await api.refund(token, payment.id);
      const updated = await api.getStripePayment(token, payment.id);
      setPayment(updated); onRefunded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Refund failed");
    } finally { setRefunding(false); }
  }

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Payment Detail" subtitle={paymentId} badge={<CardBadge />} onClose={onClose} />
      <div className="p-5 space-y-5">
        {loading && <LoadingSkeleton variant="detail" />}
        {error && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>{error}</div>
        )}
        {payment && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-mono font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {formatStripeAmount(payment.amount, payment.currency)}
                  <span className="text-xs ml-1.5 align-super" style={{ color: "var(--text-muted)" }}>{payment.currency.toUpperCase()}</span>
                </p>
                {payment.stripe_payment_intent_id && (
                  <p className="text-[10px] font-mono mt-1 truncate max-w-[280px]" style={{ color: "var(--text-label)" }}>{payment.stripe_payment_intent_id}</p>
                )}
              </div>
              <StatusBadge status={payment.status} />
            </div>

            <div style={{ borderTop: "1px solid var(--border)" }} />

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-label)" }}>Transactions</p>
              {payment.transactions.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No transactions recorded yet.</p>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  {payment.transactions.map((t, i) => (
                    <div key={t.id} className="flex items-center justify-between px-4 py-3"
                      style={{ borderBottom: i < payment.transactions.length - 1 ? "1px solid var(--border)" : "none", background: "var(--bg-elevated)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{transactionLabel(t.type)}</p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>{formatDate(t.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={t.status} size="sm" />
                        <span className="text-sm font-mono tabular-nums" style={{ color: t.type !== "charge" ? "#F87171" : "var(--text-primary)" }}>
                          {t.type !== "charge" ? "−" : ""}{formatStripeAmount(t.amount, t.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {payment.status === "succeeded" && (
              <button onClick={handleRefund} disabled={!canRefund || refunding} className="btn-danger w-full py-2.5 text-sm">
                {refunding ? "Processing refund..." : canRefund ? "Refund full amount" : "Fully refunded"}
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}