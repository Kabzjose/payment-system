import {  useState } from "react";
import { useAuth } from "../../lib/auth";
import { useAdminStats } from "../../hooks/useAdminData";
import { StatsRow } from "../admin/StatsRow";
import { PaymentsTable } from "../admin/PaymentsTable";
import { UsersTable } from "../admin/UsersTable";
import { SubscriptionBreakdown } from "../admin/SubscriptionBreakdown";

type AdminTab = "overview" | "payments" | "users";

export function AdminPage() {
  const { token, user, loading: authLoading } = useAuth();
  const { data: stats, loading: statsLoading, error: statsError } = useAdminStats();
  const [tab, setTab] = useState<AdminTab>("overview");

  // If not logged in at all, show login prompt
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0E1116] flex items-center justify-center">
        <p className="font-mono text-[13px] text-[#8B8578]">Loading...</p>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-[#0E1116] flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-[13px] text-[#8B8578] mb-4">
            You must be logged in to access the admin dashboard.
          </p>
          <a
            href="/"
            className="font-mono text-[13px] text-[#F7F5F0] underline"
          >
            Go to login →
          </a>
        </div>
      </div>
    );
  }

  // If stats returned 403, user is not admin
  if (statsError?.includes("403") || statsError?.includes("Admin")) {
    return (
      <div className="min-h-screen bg-[#0E1116] flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-2xl text-[#F7F5F0] mb-2">
            Access Denied
          </p>
          <p className="font-mono text-[13px] text-[#8B8578]">
            Your account does not have admin privileges.
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "overview",  label: "Overview"  },
    { id: "payments",  label: "Payments"  },
    { id: "users",     label: "Users"     },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      {/* Header */}
      <header className="bg-[#0E1116] border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.25em] text-[#8B8578] uppercase mb-0.5">
            Admin
          </div>
          <div className="font-serif text-[#F7F5F0] text-lg">
            Payment System Dashboard
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] text-[#8B8578]">
            {user.email}
          </span>
          <a
            href="/"
            className="font-mono text-[12px] text-[#8B8578] hover:text-[#F7F5F0] transition-colors"
          >
            ← User dashboard
          </a>
        </div>
      </header>

      {/* Tab nav */}
      <div className="bg-[#0E1116] border-b border-white/10 px-6">
        <div className="flex gap-1 pt-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-t-md font-mono text-[13px] transition-colors ${
                tab === t.id
                  ? "bg-[#F7F5F0] text-[#0E1116]"
                  : "text-[#8B8578] hover:text-[#F7F5F0]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Overview tab */}
        {tab === "overview" && (
          <>
            {statsLoading ? (
              <p className="text-[13px] text-[#8B8578]">Loading stats...</p>
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
                    {/* Recent payments preview */}
                    <div className="bg-white rounded-xl border border-[#E5E2DA] p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-mono text-[11px] uppercase tracking-widest text-[#8B8578]">
                          Quick glance
                        </h2>
                        <button
                          onClick={() => setTab("payments")}
                          className="font-mono text-[11px] text-[#3b82f6] hover:underline"
                        >
                          View all →
                        </button>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: "Stripe revenue", value: `$${(stats.stripeRevenueCents / 100).toFixed(2)}` },
                          { label: "M-Pesa revenue", value: `KES ${(stats.mpesaRevenueCents / 100).toLocaleString()}` },
                          { label: "Active subscribers", value: stats.activeSubscriptions },
                          { label: "Failed payments", value: stats.failedPayments },
                          { label: "Non-admin users", value: stats.totalUsers - stats.adminUsers },
                        ].map((row) => (
                          <div
                            key={row.label}
                            className="flex justify-between items-center py-2 border-b border-[#F0EEE9] last:border-0"
                          >
                            <span className="font-mono text-[12px] text-[#8B8578]">
                              {row.label}
                            </span>
                            <span className="font-serif text-[14px] text-[#0E1116] tabular-nums">
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

        {tab === "payments" && <PaymentsTable />}
        {tab === "users"    && <UsersTable />}
      </main>
    </div>
  );
}