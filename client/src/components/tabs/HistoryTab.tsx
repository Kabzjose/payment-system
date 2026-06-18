import { useState } from "react";
import { type UnifiedPayment,type StripePayment,type MpesaPayment } from "../../lib/api";
import {
  formatStripeAmount,
  formatMpesaAmount,
  timeAgo,
} from "../../lib/format";
import { StatusPill } from "../Statuspill";
import { StripeDetail } from "../modals/StripeDetail";
import { MpesaDetail } from "../modals/MpesaDetail";

function PaymentRow({
  payment,
  onClick,
}: {
  payment: UnifiedPayment;
  onClick: () => void;
}) {
  const isStripe = payment.source === "stripe";

  const amount = isStripe
    ? formatStripeAmount((payment as StripePayment).amount, (payment as StripePayment).currency)
    : formatMpesaAmount((payment as MpesaPayment).amount);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#0E1116]/[0.02] transition-colors border-b border-[#E5E2DA] last:border-b-0"
    >
      {/* Left: method badge + ID + time */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`shrink-0 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
            isStripe
              ? "bg-[#eff6ff] text-[#3b82f6] border border-[#93c5fd]/40"
              : "bg-[#fffbeb] text-[#9C7A1F] border border-[#fcd34d]/40"
          }`}
        >
          {isStripe ? "CARD" : "MPESA"}
        </span>
        <div className="min-w-0">
          <div className="font-mono text-[11px] text-[#8B8578] truncate">
            {payment.id}
          </div>
          <div className="text-[11px] text-[#8B8578] mt-0.5">
            {timeAgo(payment.created_at)}
          </div>
        </div>
      </div>

      {/* Right: status pill + amount */}
      <div className="flex items-center gap-3 shrink-0">
        <StatusPill status={payment.status} />
        <span className="font-serif text-base text-[#0E1116] tabular-nums">
          {amount}
        </span>
      </div>
    </button>
  );
}

export function HistoryTab({
  payments,
  loading,
  error,
  onRefresh,
}: {
  payments: UnifiedPayment[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [selectedStripe, setSelectedStripe] = useState<string | null>(null);
  const [selectedMpesa, setSelectedMpesa] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-[13px] text-[#8B8578]">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-[13px] text-[#C9402E] mb-3">{error}</p>
        <button
          onClick={onRefresh}
          className="text-[13px] text-[#8B8578] underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[13px] text-[#8B8578]">
          No payments yet. Make your first one using the Card or M-Pesa tab.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-[#E5E2DA]">
        {/* Summary bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#F7F5F0]">
          <span className="text-[11px] font-mono text-[#8B8578]">
            {payments.length} payment{payments.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onRefresh}
            className="text-[11px] font-mono text-[#8B8578] hover:text-[#0E1116] transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Payment rows */}
        {payments.map((p) => (
          <PaymentRow
            key={`${p.source}-${p.id}`}
            payment={p}
            onClick={() => {
              if (p.source === "stripe") setSelectedStripe(p.id);
              else setSelectedMpesa(p.id);
            }}
          />
        ))}
      </div>

      {/* Detail modals */}
      {selectedStripe && (
        <StripeDetail
          paymentId={selectedStripe}
          onClose={() => setSelectedStripe(null)}
          onRefunded={onRefresh}
        />
      )}

      {selectedMpesa && (
        <MpesaDetail
          paymentId={selectedMpesa}
          onClose={() => setSelectedMpesa(null)}
        />
      )}
    </>
  );
}