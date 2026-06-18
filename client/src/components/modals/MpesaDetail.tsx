import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { api,type  MpesaPayment, ApiError } from "../../lib/api";
import {
  formatMpesaAmount,
  formatDate,
  formatPhone,
  mpesaResultLabel,
} from "../../lib/format";
import { StatusPill } from "../Statuspill";

export function MpesaDetail({
  paymentId,
  onClose,
}: {
  paymentId: string;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [payment, setPayment] = useState<MpesaPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .getMpesaPayment(token, paymentId)
      .then(setPayment)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [token, paymentId]);

  return (
    <div className="fixed inset-0 bg-[#0E1116]/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#F7F5F0] rounded-t-xl sm:rounded-xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#F7F5F0] border-b border-[#E5E2DA] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#fffbeb] text-[#9C7A1F] border border-[#fcd34d]/40">
              MPESA
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
                    {formatMpesaAmount(payment.amount)}
                  </div>
                  <div className="font-mono text-[11px] text-[#8B8578] mt-1">
                    {payment.id}
                  </div>
                </div>
                <StatusPill status={payment.status} />
              </div>

              {/* Details grid */}
              <div className="border border-[#E5E2DA] rounded-lg overflow-hidden">
                {[
                  { label: "Phone", value: formatPhone(payment.phone_number) },
                  { label: "Reference", value: payment.account_reference },
                  { label: "Description", value: payment.transaction_desc },
                  {
                    label: "Date",
                    value: formatDate(payment.created_at),
                  },
                  payment.checkout_request_id
                    ? { label: "Checkout ID", value: payment.checkout_request_id }
                    : null,
                ]
                  .filter(Boolean)
                  .map((row) => (
                    <div
                      key={row!.label}
                      className="flex justify-between items-center px-4 py-3 border-b border-[#E5E2DA] last:border-b-0 bg-white"
                    >
                      <span className="font-mono text-[11px] text-[#8B8578]">
                        {row!.label}
                      </span>
                      <span className="font-mono text-[12px] text-[#0E1116] text-right max-w-[220px] truncate">
                        {row!.value}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Receipt (success) */}
              {payment.status === "succeeded" &&
                payment.mpesa_receipt_number && (
                  <div className="bg-[#dcfce7] border border-[#86efac]/40 rounded-lg p-4 space-y-1">
                    <p className="text-[11px] font-mono text-[#2D6A4F] uppercase tracking-wide">
                      M-Pesa Receipt
                    </p>
                    <p className="font-mono text-lg font-medium text-[#2D6A4F]">
                      {payment.mpesa_receipt_number}
                    </p>
                  </div>
                )}

              {/* Failure reason */}
              {(payment.status === "failed" ||
                payment.status === "cancelled") && (
                <div className="bg-[#fee2e2] border border-[#fca5a5]/40 rounded-lg p-4 space-y-1">
                  <p className="text-[11px] font-mono text-[#C9402E] uppercase tracking-wide">
                    Failure reason
                  </p>
                  <p className="font-mono text-[13px] text-[#C9402E]">
                    {mpesaResultLabel(payment.result_code)}
                  </p>
                  {payment.result_desc && (
                    <p className="text-[11px] text-[#C9402E]/70">
                      {payment.result_desc}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}