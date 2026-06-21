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
    <div className="bg-white rounded-xl border border-[#E5E2DA] p-5">
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-[#8B8578] mb-4">
        Subscription Breakdown
      </h2>

      <div className="space-y-3">
        {plans.map((plan) => {
          const count = parseInt(String(plan.subscriber_count), 10);
          const pct = activeTotal > 0 ? (count / activeTotal) * 100 : 0;

          return (
            <div key={plan.name}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="font-medium text-[13px] text-[#0E1116]">
                    {plan.name}
                  </span>
                  <span className="ml-2 font-mono text-[11px] text-[#8B8578]">
                    {formatStripeAmount(plan.amount, plan.currency)}/mo
                  </span>
                </div>
                <span className="font-mono text-[12px] text-[#0E1116]">
                  {count} users
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-[#F0EEE9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2D6A4F] rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}

        {pastDue > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-[#fee2e2] border border-[#fca5a5]/40">
            <p className="font-mono text-[12px] text-[#C9402E]">
              ⚠ {pastDue} subscription{pastDue !== 1 ? "s" : ""} past due —
              payment failed and Stripe is retrying.
            </p>
          </div>
        )}

        {activeTotal === 0 && (
          <p className="text-[13px] text-[#8B8578]">No active subscriptions yet.</p>
        )}
      </div>
    </div>
  );
}