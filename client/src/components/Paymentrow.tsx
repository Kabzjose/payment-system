import { type PaymentIntent } from "../lib/api";
import { formatAmount, formatDate } from "../lib/format";
import { StatusPill } from "./Statuspill";

export function PaymentRow({
  payment,
  onClick,
}: {
  payment: PaymentIntent;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-[#0E1116]/[0.02] transition-colors border-b border-[#E5E2DA] last:border-b-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col">
          <span className="font-mono text-[11px] text-[#8B8578] truncate max-w-[140px]">
            {payment.id}
          </span>
          <span className="text-[12px] text-[#8B8578] mt-0.5">
            {formatDate(payment.created_at)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <StatusPill status={payment.status} />
        <span className="font-serif text-lg text-[#0E1116] tabular-nums">
          {formatAmount(payment.amount, payment.currency)}
          <span className="font-mono text-[10px] text-[#8B8578] ml-1 align-super">
            {payment.currency.toUpperCase()}
          </span>
        </span>
      </div>
    </button>
  );
}