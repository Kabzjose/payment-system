import { useState } from "react";
import { useAdminStats } from "../../hooks/useAdminData";
import { AdminLayout } from "../layout/AdminLayout";
import { type AdminTab } from "../layout/AdminSidebar";
import { StatsRow } from "../admin/StatsRow";
import { PaymentsTable } from "../admin/PaymentsTable";
import { UsersTable } from "../admin/UsersTable";
import { SubscriptionBreakdown } from "../admin/SubscriptionBreakdown";

const PAGE_META: Record<AdminTab, { title: string; subtitle: string }> = {
  overview: { title: "Overview",  subtitle: "Platform health at a glance" },
  payments: { title: "Payments",  subtitle: "All Stripe & M-Pesa transactions" },
  users:    { title: "Users",     subtitle: "Registered accounts & activity" },
};

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const { data: stats, loading: statsLoading } = useAdminStats();

  const meta = PAGE_META[tab];

  return (
    <AdminLayout activeTab={tab} onNavigate={setTab} pageTitle={meta.title} pageSubtitle={meta.subtitle}>

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <>
          {statsLoading ? (
            <div className="space-y-4">
              {/* Skeleton stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-xl h-28 skeleton" style={{ border: "1px solid var(--border)" }} />
                ))}
              </div>
            </div>
          ) : stats ? (
            <>
              <StatsRow stats={stats} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <SubscriptionBreakdown
                    plans={stats.planBreakdown ?? []}
                    activeTotal={stats.activeSubscriptions}
                    pastDue={stats.pastDueSubscriptions}
                  />
                </div>

                <div className="lg:col-span-2">
                  {/* Quick-glance summary */}
                  <div
                    className="rounded-xl p-5"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2
                        className="font-mono text-[11px] font-semibold uppercase tracking-widest"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Quick Glance
                      </h2>
                      <button
                        onClick={() => setTab("payments")}
                        className="font-mono text-[11px] transition-colors"
                        style={{ color: "var(--accent)" }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                      >
                        View all →
                      </button>
                    </div>

                    <div className="space-y-1">
                      {[
                        { label: "Stripe revenue",      value: `$${(stats.stripeRevenueCents / 100).toFixed(2)}` },
                        { label: "M-Pesa revenue",      value: `KES ${(stats.mpesaRevenueCents / 100).toLocaleString()}` },
                        { label: "Active subscribers",  value: stats.activeSubscriptions },
                        { label: "Failed payments",     value: stats.failedPayments },
                        { label: "Non-admin users",     value: stats.totalUsers - stats.adminUsers },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex justify-between items-center py-2.5"
                          style={{ borderBottom: "1px solid var(--border)" }}
                        >
                          <span
                            className="font-mono text-[12px] font-medium"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {row.label}
                          </span>
                          <span
                            className="font-semibold text-[14px] tabular-nums"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* ── Payments ─────────────────────────────────────────────────────── */}
      {tab === "payments" && <PaymentsTable />}

      {/* ── Users ────────────────────────────────────────────────────────── */}
      {tab === "users" && <UsersTable />}

    </AdminLayout>
  );
}