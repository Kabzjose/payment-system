import { statusConfig } from "../lib/format";

export function StatusPill({ status }: { status: string }) {
  const { label, tone } = statusConfig(status);

  const toneStyles: Record<string, string> = {
    success: "bg-[#ECFDF5] text-[#047857] border-[#D1FAE5]",
    pending: "bg-[#FFFBEB] text-[#92400E] border-[#FEE3B0]",
    failed: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
    neutral: "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-medium tracking-wide ${toneStyles[tone]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          tone === "success"
            ? "bg-[#10B981]"
            : tone === "pending"
            ? "bg-[#F59E0B] animate-pulse"
            : tone === "failed"
            ? "bg-[#EF4444]"
            : "bg-[#94A3B8]"
        }`}
      />
      {label}
    </span>
  );
}