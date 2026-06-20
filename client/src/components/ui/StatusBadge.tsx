import { statusConfig, type StatusTone } from "../../lib/format";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  failed:  "bg-red-500/10 text-red-400 border-red-500/20",
  neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const dotClasses: Record<StatusTone, string> = {
  success: "bg-emerald-400",
  pending: "bg-amber-400 pulse-dot",
  failed:  "bg-red-400",
  neutral: "bg-slate-400",
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const { label, tone } = statusConfig(status);

  const sizeClass = size === "sm"
    ? "px-2 py-0.5 text-[10px] gap-1"
    : "px-2.5 py-1 text-[11px] gap-1.5";

  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-1.5 h-1.5";

  return (
    <span
      className={`inline-flex items-center border rounded-full font-mono font-medium tracking-wide ${sizeClass} ${toneClasses[tone]}`}
    >
      <span className={`rounded-full shrink-0 ${dotSize} ${dotClasses[tone]}`} />
      {label}
    </span>
  );
}
