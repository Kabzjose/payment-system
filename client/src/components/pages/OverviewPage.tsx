import { type UnifiedPayment, type StripePayment, type MpesaPayment } from "../../lib/api";
import { formatStripeAmount, formatMpesaAmount, timeAgo } from "../../lib/format";
import { StatCard } from "../ui/StatCard";
import { StatusBadge } from "../ui/StatusBadge";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";
import { EmptyState } from "../ui/EmptyState";
import { type Page } from "../layout/Sidebar";
import { useSubscription } from "../../hooks/useSubscription";

interface OverviewPageProps {
  payments: UnifiedPayment[];
  loading: boolean;
  onNavigate: (page: Page) => void;
}

export function OverviewPage({ payments, loading, onNavigate }: OverviewPageProps) {
  const { subscription } = useSubscription();

  const totalStripe = payments
    .filter((p) => p.source === "stripe" && p.status === "succeeded")
    .reduce((sum, p) => sum + (p as StripePayment).amount, 0);

  const totalMpesa = payments
    .filter((p) => p.source === "mpesa" && p.status === "succeeded")
    .reduce((sum, p) => sum + (p as MpesaPayment).amount, 0);

  const successCount = payments.filter((p) => p.status === "succeeded").length;
  const recentPayments = payments.slice(0, 5);

  const subStatus = subscription
    ? subscription.status === "active" ? "Active"
    : subscription.status === "trialing" ? "Trial"
    : subscription.status === "past_due" ? "Past Due"
    : subscription.status
    : "None";

  const subAccent = subscription?.status === "active" ? "emerald"
    : subscription?.status === "trialing" ? "amber"
    : "indigo" as const;

  return (
    <div className="max-w-6xl mx-auto space-y-8 fade-in">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Dashboard Overview</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Your payments and billing at a glance</p>
      </div>

      {loading ? <LoadingSkeleton variant="cards" /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Card Payments"
            value={totalStripe > 0 ? formatStripeAmount(totalStripe, "usd") : "$0.00"}
            subtitle={`${payments.filter(p => p.source === "stripe").length} transactions`}
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
            accentColor="indigo"
          />
          <StatCard
            title="M-Pesa Payments"
            value={totalMpesa > 0 ? formatMpesaAmount(totalMpesa) : "KES 0"}
            subtitle={`${payments.filter(p => p.source === "mpesa").length} transactions`}
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
            accentColor="emerald"
          />
          <StatCard
            title="Successful"
            value={successCount.toString()}
            subtitle="Completed payments"
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            accentColor="blue"
          />
          <StatCard
            title="Subscription"
            value={subStatus}
            subtitle={subscription?.plan?.name ?? "No active plan"}
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
            accentColor={subAccent}
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="rounded-xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button id="quick-card-payment" onClick={() => onNavigate("card")} className="btn-primary text-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            New Card Payment
          </button>
          <button id="quick-mpesa-payment" onClick={() => onNavigate("mpesa")} className="btn-secondary text-sm"
            style={{ color: "#10B981", borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            M-Pesa Payment
          </button>
          <button id="quick-view-history" onClick={() => onNavigate("history")} className="btn-ghost text-sm">
            View all transactions →
          </button>
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Transactions</h3>
          <button onClick={() => onNavigate("history")} className="text-xs font-medium" style={{ color: "var(--accent)" }}>
            View all →
          </button>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          {loading ? <LoadingSkeleton variant="table" /> : recentPayments.length === 0 ? (
            <EmptyState icon="📊" title="No transactions yet"
              description="Make your first payment using Card or M-Pesa to see your activity here."
              action={{ label: "Make a payment", onClick: () => onNavigate("card") }} />
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-label)", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                <span>Transaction</span>
                <span>Status</span>
                <span className="text-right">Amount</span>
              </div>
              {recentPayments.map((p) => {
                const isStripe = p.source === "stripe";
                const amount = isStripe
                  ? formatStripeAmount((p as StripePayment).amount, (p as StripePayment).currency)
                  : formatMpesaAmount((p as MpesaPayment).amount);
                return (
                  <div key={`${p.source}-${p.id}`}
                    className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3.5 transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-row-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={isStripe
                          ? { background: "rgba(99,102,241,0.12)", color: "#818CF8" }
                          : { background: "rgba(16,185,129,0.12)", color: "#34D399" }}>
                        {isStripe ? "💳" : "📱"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
                          {isStripe ? "Card" : "M-Pesa"}
                        </p>
                        <p className="text-[10px] font-mono truncate" style={{ color: "var(--text-label)" }}>
                          {timeAgo(p.created_at)}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={p.status} size="sm" />
                    <span className="text-sm font-mono font-semibold tabular-nums text-right" style={{ color: "var(--text-primary)" }}>
                      {amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
