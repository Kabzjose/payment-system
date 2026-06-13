import { statusConfig } from "../lib/format";

export function StatusPill({ status }: { status: string }) {
  const { label, tone } = statusConfig(status);

  const toneStyles: Record<string, string> = {
    success: "bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20",
    pending: "bg-[#E8C170]/15 text-[#9C7A1F] border-[#E8C170]/30",
    failed: "bg-[#C9402E]/10 text-[#C9402E] border-[#C9402E]/20",
    neutral: "bg-[#8B8578]/10 text-[#6B665C] border-[#8B8578]/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-medium tracking-wide ${toneStyles[tone]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          tone === "success"
            ? "bg-[#2D6A4F]"
            : tone === "pending"
            ? "bg-[#E8C170] animate-pulse"
            : tone === "failed"
            ? "bg-[#C9402E]"
            : "bg-[#8B8578]"
        }`}
      />
      {label}
    </span>
  );
}