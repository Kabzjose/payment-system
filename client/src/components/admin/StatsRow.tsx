import { formatStripeAmount } from "../../lib/format";

interface Stats {
  totalRevenueCents: number;
  stripeRevenueCents: number;
  mpesaRevenueCents: number;
  totalUsers: number;
  adminUsers: number;
  activeSubscriptions: number;
  pastDueSubscriptions: number;
  failedPayments: number;
}

type Tone = "green" | "blue" | "amber" | "red";

const TONE_STYLES: Record<Tone, { bg: string; border: string; text: string; subText: string }> = {
  green: { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.2)",  text: "#22C55E", subText: "rgba(34,197,94,0.7)"  },
  blue:  { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)", text: "#818CF8", subText: "rgba(129,140,248,0.7)" },
  amber: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#F59E0B", subText: "rgba(245,158,11,0.7)"  },
  red:   { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",  text: "#EF4444", subText: "rgba(239,68,68,0.7)"   },
};

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone: Tone;
}) {
  const s = TONE_STYLES[tone];
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <p
        className="font-mono text-[11px] uppercase tracking-wide mb-2"
        style={{ color: s.subText }}
      >
        {label}
      </p>
      <p className="text-3xl font-bold tabular-nums" style={{ color: s.text }}>
        {value}
      </p>
      {sub && (
        <p className="font-mono text-[11px] mt-1" style={{ color: s.subText }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function StatsRow({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Revenue"
        value={formatStripeAmount(stats.totalRevenueCents, "usd")}
        sub="Stripe + M-Pesa combined"
        tone="green"
      />
      <StatCard
        label="Active Subscribers"
        value={stats.activeSubscriptions}
        sub={
          stats.pastDueSubscriptions > 0
            ? `${stats.pastDueSubscriptions} past due`
            : "all in good standing"
        }
        tone="blue"
      />
      <StatCard
        label="Total Users"
        value={stats.totalUsers}
        sub={`${stats.adminUsers} admin${stats.adminUsers !== 1 ? "s" : ""}`}
        tone="amber"
      />
      <StatCard
        label="Failed Payments"
        value={stats.failedPayments}
        sub="needs attention"
        tone="red"
      />
    </div>
  );
}