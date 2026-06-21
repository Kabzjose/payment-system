import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth";
import { api, type AdminUser, type AdminUserDetail, ApiError } from "../../lib/api";
import { formatStripeAmount, formatMpesaAmount, timeAgo } from "../../lib/format";
import { StatusPill } from "../Statuspill";

function UserDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { token } = useAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api
      .getAdminUserDetail(token, userId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [token, userId]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-2xl rounded-xl max-h-[85vh] overflow-y-auto"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {/* Modal header */}
        <div
          className="sticky top-0 px-5 py-4 flex items-center justify-between"
          style={{
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span className="font-mono text-[11px] uppercase tracking-wide font-semibold" style={{ color: "var(--text-muted)" }}>
            User Detail
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-lg transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-6">
          {loading && (
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</p>
          )}

          {detail && (
            <>
              {/* User info */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
                  >
                    {detail.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[15px]" style={{ color: "var(--text-primary)" }}>
                      {detail.user.name}
                    </h3>
                    <p className="font-mono text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                      {detail.user.email}
                    </p>
                  </div>
                </div>
                <p className="font-mono text-[11px] font-medium mt-2" style={{ color: "var(--text-muted)" }}>
                  Joined {timeAgo(detail.user.created_at)}
                  {detail.user.is_admin && (
                    <span
                      className="ml-2 px-1.5 py-0.5 rounded font-semibold text-[10px]"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
                    >
                      admin
                    </span>
                  )}
                </p>
              </div>

              {/* Subscriptions */}
              {detail.subscriptions.length > 0 && (
                <div>
                  <h4
                    className="font-mono text-[11px] font-semibold uppercase tracking-widest mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Subscriptions
                  </h4>
                  <div className="space-y-2">
                    {detail.subscriptions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                      >
                        <div>
                          <span className="font-medium text-[13px]" style={{ color: "var(--text-primary)" }}>
                            {s.plan_name}
                          </span>
                          <span className="ml-2 font-mono text-[12px]" style={{ color: "var(--text-muted)" }}>
                            {formatStripeAmount(s.plan_amount, "usd")}/mo
                          </span>
                        </div>
                        <StatusPill status={s.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stripe payments */}
              {detail.stripePayments.length > 0 && (
                <div>
                  <h4
                    className="font-mono text-[11px] font-semibold uppercase tracking-widest mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Card Payments ({detail.stripePayments.length})
                  </h4>
                  <div className="space-y-1">
                    {detail.stripePayments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-2.5"
                        style={{ borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        <div className="flex items-center gap-3">
                          <StatusPill status={p.status} />
                          <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {timeAgo(p.created_at)}
                          </span>
                        </div>
                        <span className="font-semibold tabular-nums text-[13px]" style={{ color: "var(--text-primary)" }}>
                          {formatStripeAmount(p.amount, p.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* M-Pesa payments */}
              {detail.mpesaPayments.length > 0 && (
                <div>
                  <h4
                    className="font-mono text-[11px] font-semibold uppercase tracking-widest mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    M-Pesa Payments ({detail.mpesaPayments.length})
                  </h4>
                  <div className="space-y-1">
                    {detail.mpesaPayments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-2.5"
                        style={{ borderBottom: "1px solid var(--border-subtle)" }}
                      >
                        <div className="flex items-center gap-3">
                          <StatusPill status={p.status} />
                          <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {timeAgo(p.created_at)}
                          </span>
                        </div>
                        <span className="font-semibold tabular-nums text-[13px]" style={{ color: "var(--text-primary)" }}>
                          {formatMpesaAmount(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function UsersTable() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api
      .getAdminUsers(token, { page, search })
      .then((res) => { setUsers(res.users); setTotal(res.total); })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [token, page, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 20);

  return (
    <>
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between gap-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            All Users{" "}
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>{total}</span>
          </h2>
          <input
            type="text"
            placeholder="Search email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-base px-3 py-1.5 text-[12px] font-mono w-44"
          />
        </div>

        {loading ? (
          <p className="text-[13px] px-5 py-8" style={{ color: "var(--text-muted)" }}>Loading...</p>
        ) : error ? (
          <p className="text-[13px] px-5 py-8" style={{ color: "#EF4444" }}>{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                  {["User", "Joined", "Payments", "Subscription", "Total Spent", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: "var(--text-label)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-row-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                        {u.name}
                        {u.is_admin && (
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
                          >
                            admin
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono font-medium" style={{ color: "var(--text-muted)" }}>
                        {u.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                      {timeAgo(u.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                      {parseInt(String(u.stripe_payment_count), 10) +
                        parseInt(String(u.mpesa_payment_count), 10)}{" "}
                      payments
                    </td>
                    <td className="px-4 py-3">
                      {u.subscription_status ? (
                        <div>
                          <StatusPill status={u.subscription_status} />
                          <div className="font-mono text-[10px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {u.plan_name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px]" style={{ color: "var(--text-label)" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <div className="font-semibold text-[13px]" style={{ color: "var(--text-primary)" }}>
                        {formatStripeAmount(parseInt(String(u.stripe_total_cents), 10), "usd")}
                      </div>
                      {parseInt(String(u.mpesa_total_kes), 10) > 0 && (
                        <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          + {formatMpesaAmount(parseInt(String(u.mpesa_total_kes), 10))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedUserId(u.id)}
                        className="font-mono text-[11px] transition-opacity"
                        style={{ color: "var(--accent)" }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-[13px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span className="font-mono text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost px-3 py-1 text-[12px] disabled:opacity-30"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-ghost px-3 py-1 text-[12px] disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </>
  );
}