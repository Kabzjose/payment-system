import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth";
import { api, type MpesaPayment, ApiError } from "../../lib/api";
import { formatMpesaAmount, formatDate, formatPhone, mpesaResultLabel } from "../../lib/format";
import { StatusBadge } from "../ui/StatusBadge";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";
import { Modal, ModalHeader } from "../ui/Modal";

const MpesaBadge = () => (
  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
    style={{ background: "rgba(16,185,129,0.12)", color: "#34D399" }}>MPESA</span>
);

export function MpesaDetail({ paymentId, onClose }: { paymentId: string; onClose: () => void }) {
  const { token } = useAuth();
  const [payment, setPayment] = useState<MpesaPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.getMpesaPayment(token, paymentId).then(setPayment)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [token, paymentId]);

  const detailRows = payment ? [
    { label: "Phone", value: formatPhone(payment.phone_number) },
    { label: "Reference", value: payment.account_reference },
    { label: "Description", value: payment.transaction_desc },
    { label: "Date", value: formatDate(payment.created_at) },
    ...(payment.checkout_request_id ? [{ label: "Checkout ID", value: payment.checkout_request_id }] : []),
  ] : [];

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="M-Pesa Detail" subtitle={paymentId} badge={<MpesaBadge />} onClose={onClose} />
      <div className="p-5 space-y-5">
        {loading && <LoadingSkeleton variant="detail" />}
        {error && (
          <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>{error}</div>
        )}
        {payment && (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-mono font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{formatMpesaAmount(payment.amount)}</p>
                <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-label)" }}>{payment.id}</p>
              </div>
              <StatusBadge status={payment.status} />
            </div>

            <div style={{ borderTop: "1px solid var(--border)" }} />

            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {detailRows.map((row, i) => (
                <div key={row.label} className="flex justify-between items-center px-4 py-3"
                  style={{ borderBottom: i < detailRows.length - 1 ? "1px solid var(--border)" : "none", background: "var(--bg-elevated)" }}>
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                  <span className="text-xs font-mono text-right max-w-[220px] truncate" style={{ color: "var(--text-secondary)" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {payment.status === "succeeded" && payment.mpesa_receipt_number && (
              <div className="rounded-xl p-4 space-y-1" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#10B981" }}>M-Pesa Receipt</p>
                <p className="text-lg font-mono font-semibold" style={{ color: "#34D399" }}>{payment.mpesa_receipt_number}</p>
              </div>
            )}

            {(payment.status === "failed" || payment.status === "cancelled") && (
              <div className="rounded-xl p-4 space-y-1" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#EF4444" }}>Failure reason</p>
                <p className="text-sm font-mono" style={{ color: "#F87171" }}>{mpesaResultLabel(payment.result_code)}</p>
                {payment.result_desc && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{payment.result_desc}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}