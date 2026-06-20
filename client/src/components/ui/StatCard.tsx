interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: "indigo" | "emerald" | "amber" | "blue";
  trend?: { value: string; positive: boolean };
}

const accentMap = {
  indigo:  { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)",  text: "#818CF8", iconBg: "rgba(99,102,241,0.15)" },
  emerald: { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  text: "#34D399", iconBg: "rgba(16,185,129,0.15)" },
  amber:   { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  text: "#FBBF24", iconBg: "rgba(245,158,11,0.15)" },
  blue:    { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  text: "#60A5FA", iconBg: "rgba(59,130,246,0.15)" },
};

export function StatCard({ title, value, subtitle, icon, accentColor = "indigo", trend }: StatCardProps) {
  const accent = accentMap[accentColor];

  return (
    <div
      className="relative rounded-xl p-5 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg group overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: `1.5px solid ${accent.border}`,
        boxShadow: "var(--card-shadow)",
      }}
    >
      {/* Subtle corner gradient */}
      <div
        className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-30 group-hover:opacity-50 transition-opacity duration-300"
        style={{ background: accent.bg }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
          >
            {title}
          </p>
          <p
            className="text-3xl font-bold tabular-nums leading-none"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs font-medium mt-2" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2.5 text-xs font-semibold ${trend.positive ? "text-emerald-400" : "text-red-400"}`}>
              <span>{trend.positive ? "↑" : "↓"}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: accent.iconBg, color: accent.text }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
