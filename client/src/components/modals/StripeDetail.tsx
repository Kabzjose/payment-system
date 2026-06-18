import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { api,type  StripePaymentWithTransactions, ApiError } from "../../lib/api";
import {
  formatStripeAmount,
  formatDate,
  transactionLabel,
} from "../../lib/format";
import { StatusPill } from "../Statuspill";

export function StripeDetail({
  paymentId,
  onClose,
  onRefunded,
}: {
  paymentId: string;
  onClose: () => void;
  onRefunded: () => void;
}) {
  const { token } = useAuth();
  const [payment, setPayment] = useState<StripePaymentWithTransactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .getStripePayment(token, paymentId)
      .then(setPayment)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [token, paymentId]);

  const refundedTotal =
    payment?.transactions
      .filter(
        (t) =>
          (t.type === "refund" || t.type === "partial_refund") &&
          t.status === "succeeded"
      )
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

  const canRefund =
    payment?.status === "succeeded" && refundedTotal < payment.amount;

  async function handleRefund() {
    if (!token || !payment) return;
    setRefunding(true);
    setError(null);
    try {
      await api.refund(token, payment.id);
      const updated = await api.getStripePayment(token, payment.id);
      setPayment(updated);
      onRefunded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Refund failed");
    } finally {
      setRefunding(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0E1116]/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#F7F5F0] rounded-t-xl sm:rounded-xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#F7F5F0] border-b border-[#E5E2DA] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#eff6ff] text-[#3b82f6] border border-[#93c5fd]/40">
              CARD
            </span>
            <span className="font-mono text-[11px] text-[#8B8578]">
              Payment detail
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8B8578] hover:text-[#0E1116] text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-5 space-y-5">
          {loading && (
            <p className="text-[13px] text-[#8B8578]">Loading...</p>
          )}

          {error && (
            <div className="text-[13px] text-[#C9402E] bg-[#C9402E]/8 border border-[#C9402E]/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {payment && (
            <>
              {/* Amount + status */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-serif text-3xl text-[#0E1116] tabular-nums">
                    {formatStripeAmount(payment.amount, payment.currency)}
                    <span className="font-mono text-[11px] text-[#8B8578] ml-1.5 align-super">
                      {payment.currency.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-[#8B8578] mt-1">
                    {payment.id}
                  </div>
                </div>
                <StatusPill status={payment.status} />
              </div>

              {/* Stripe ID */}
              {payment.stripe_payment_intent_id && (
                <div className="flex justify-between text-[12px]">
                  <span className="font-mono text-[#8B8578]">Stripe ID</span>
                  <span className="font-mono text-[#0E1116] truncate max-w-[200px]">
                    {payment.stripe_payment_intent_id}
                  </span>
                </div>
              )}

              {/* Transactions */}
              <div>
                <h3 className="font-mono text-[11px] tracking-[0.15em] text-[#8B8578] uppercase mb-3">
                  Transactions
                </h3>
                {payment.transactions.length === 0 ? (
                  <p className="text-[13px] text-[#8B8578]">
                    No transactions recorded yet.
                  </p>
                ) : (
                  <div className="space-y-0 border border-[#E5E2DA] rounded-lg overflow-hidden">
                    {payment.transactions.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between px-4 py-3 text-[13px] border-b border-[#E5E2DA] last:border-b-0 bg-white"
                      >
                        <div>
                          <div className="font-medium text-[#0E1116]">
                            {transactionLabel(t.type)}
                          </div>
                          <div className="font-mono text-[11px] text-[#8B8578]">
                            {formatDate(t.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusPill status={t.status} />
                          <span className="font-mono text-[13px] tabular-nums">
                            {t.type !== "charge" ? "−" : ""}
                            {formatStripeAmount(t.amount, t.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Refund button */}
              {payment.status === "succeeded" && (
                <button
                  onClick={handleRefund}
                  disabled={!canRefund || refunding}
                  className="w-full py-2.5 rounded-md border border-[#C9402E]/30 text-[#C9402E] text-[14px] font-medium hover:bg-[#C9402E]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {refunding
                    ? "Processing refund..."
                    : canRefund
                    ? "Refund full amount"
                    : "Fully refunded"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}