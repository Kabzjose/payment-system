import { formatStripeAmount } from "../../lib/format";

interface PlanBreakdown {
  name: string;
  amount: number;
  currency: string;
  subscriber_count: number;
}

export function SubscriptionBreakdown({
  plans,
  activeTotal,
  pastDue,
}: {
  plans: PlanBreakdown[];
  activeTotal: number;
  pastDue: number;
}) {
  return (
    <div
      className="rounded-xl p-5 h-full"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <h2
        className="font-mono text-[11px] font-semibold uppercase tracking-widest mb-4"
        style={{ color: "var(--text-muted)" }}
      >
        Subscription Breakdown
      </h2>

      <div className="space-y-4">
        {plans.map((plan) => {
          const count = parseInt(String(plan.subscriber_count), 10);
          const pct = activeTotal > 0 ? (count / activeTotal) * 100 : 0;

          return (
            <div key={plan.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="font-medium text-[13px]" style={{ color: "var(--text-primary)" }}>
                    {plan.name}
                  </span>
                  <span className="ml-2 font-mono text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                    {formatStripeAmount(plan.amount, plan.currency)}/mo
                  </span>
                </div>
                <span className="font-mono text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  {count} users
                </span>
              </div>
              {/* Progress bar */}
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: "var(--accent)" }}
                />
              </div>
            </div>
          );
        })}

        {pastDue > 0 && (
          <div
            className="mt-4 p-3 rounded-lg"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <p className="font-mono text-[12px]" style={{ color: "#EF4444" }}>
              ⚠ {pastDue} subscription{pastDue !== 1 ? "s" : ""} past due —
              payment failed and Stripe is retrying.
            </p>
          </div>
        )}

        {activeTotal === 0 && (
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            No active subscriptions yet.
          </p>
        )}
      </div>
    </div>
  );
}