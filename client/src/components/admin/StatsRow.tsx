import { formatStripeAmount } from "../../lib/format";

interface Stats {
  totalRevenueCents: number;
  stripeRevenueCents: number;
  mpesaRevenueCents: number;
  totalUsers: number;
  activeSubscriptions: number;
  pastDueSubscriptions: number;
  failedPayments: number;
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone: "green" | "blue" | "amber" | "red";
}) {
  const colors = {
    green: "bg-[#dcfce7] border-[#86efac] text-[#2D6A4F]",
    blue:  "bg-[#eff6ff] border-[#93c5fd] text-[#3b82f6]",
    amber: "bg-[#fffbeb] border-[#fcd34d] text-[#9C7A1F]",
    red:   "bg-[#fee2e2] border-[#fca5a5] text-[#C9402E]",
  };

  return (
    <div className={`rounded-xl border p-5 ${colors[tone]}`}>
      <p className="font-mono text-[11px] uppercase tracking-wide opacity-70 mb-2">
        {label}
      </p>
      <p className="font-serif text-3xl font-medium tabular-nums">{value}</p>
      {sub && (
        <p className="font-mono text-[11px] mt-1 opacity-60">{sub}</p>
      )}
    </div>
  );
}

export function StatsRow({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        label="Total Revenue"
        value={formatStripeAmount(stats.totalRevenueCents, "usd")}
        sub={`Stripe + M-Pesa combined`}
        tone="green"
      />
      <StatCard
        label="Active Subscribers"
        value={stats.activeSubscriptions}
        sub={stats.pastDueSubscriptions > 0
          ? `${stats.pastDueSubscriptions} past due`
          : "all in good standing"}
        tone="blue"
      />
      <StatCard
        label="Total Users"
        value={stats.totalUsers}
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