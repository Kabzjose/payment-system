import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { api, type PaymentWithTransactions, ApiError } from "../lib/api";
import { formatAmount, formatDate, transactionLabel } from "../lib/format";
import { StatusPill } from "./Statuspill";

export function PaymentDetail({
  paymentId,
  onClose,
  onRefunded,
}: {
  paymentId: string;
  onClose: () => void;
  onRefunded: () => void;
}) {
  const { token } = useAuth();
  const [payment, setPayment] = useState<PaymentWithTransactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .getPayment(token, paymentId)
      .then(setPayment)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token, paymentId]);

  // Sum of all completed refunds — used to determine if a refund is still possible
  const refundedSoFar =
    payment?.transactions
      .filter((t) => (t.type === "refund" || t.type === "partial_refund") && t.status === "succeeded")
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;

  const canRefund = payment?.status === "succeeded" && refundedSoFar < payment.amount;

  async function handleRefund() {
    if (!token || !payment) return;
    setRefunding(true);
    setError(null);

    try {
      await api.refund(token, payment.id);
      // Reload the payment to show the new refund transaction
      const updated = await api.getPayment(token, payment.id);
      setPayment(updated);
      onRefunded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Refund failed");
    } finally {
      setRefunding(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#000000]/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#FFFFFF] rounded-t-xl sm:rounded-xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#FFFFFF] border-b border-[#E2E8F0] px-5 py-4 flex items-center justify-between">
          <span className="font-mono text-[11px] tracking-[0.15em] text-[#64748B] uppercase">
            Payment detail
          </span>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#3B82F6] text-[20px] leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="p-5">
          {loading && <p className="text-[13px] text-[#64748B]">Loading...</p>}

          {error && !loading && (
            <div className="text-[13px] text-[#DC2626] bg-[#FEE2E2] border border-[#FECACA] rounded-md px-3 py-2 mb-4">
              {error}
            </div>
          )}

          {payment && (
            <>
              <div className="flex items-start justify-between mb-1">
                <span className="font-serif text-3xl text-[#1E293B] tabular-nums">
                  {formatAmount(payment.amount, payment.currency)}
                  <span className="font-mono text-[11px] text-[#64748B] ml-1.5 align-super">
                    {payment.currency.toUpperCase()}
                  </span>
                </span>
                <StatusPill status={payment.status} />
              </div>
              <p className="font-mono text-[11px] text-[#64748B] mb-6">{payment.id}</p>

              <div className="mb-6">
                <h3 className="font-mono text-[11px] tracking-[0.15em] text-[#64748B] uppercase mb-2">
                  Transactions
                </h3>
                {payment.transactions.length === 0 ? (
                  <p className="text-[13px] text-[#64748B]">No transactions recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {payment.transactions.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between text-[13px] py-2 border-b border-[#E2E8F0] last:border-b-0"
                      >
                        <div>
                          <div className="font-medium text-[#1E293B]">{transactionLabel(t.type)}</div>
                          <div className="font-mono text-[11px] text-[#64748B]">{formatDate(t.created_at)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusPill status={t.status} />
                          <span className="font-mono text-[13px] tabular-nums text-[#1E293B]">
                            {t.type !== "charge" ? "−" : ""}
                            {formatAmount(t.amount, t.currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {payment.status === "succeeded" && (
                <button
                  onClick={handleRefund}
                  disabled={!canRefund || refunding}
                  className="w-full py-2.5 rounded-md border border-[#FECACA] text-[#DC2626] text-[14px] font-medium hover:bg-[#FEE2E2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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