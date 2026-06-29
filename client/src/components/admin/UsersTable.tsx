import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth";
import { api, type AdminUser, type AdminUserDetail, ApiError } from "../../lib/api";
import { formatStripeAmount, formatMpesaAmount, timeAgo } from "../../lib/format";
import { StatusPill } from "../Statuspill";

function UserDetailModal({
  userId,
  onClose,
  onAction,
}: {
  userId: string;
  onClose: () => void;
  onAction: () => void;
}) {
  const { token } = useAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendInput, setShowSuspendInput] = useState(false);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [cancelingSubId, setCancelingSubId] = useState<string | null>(null);

  function loadDetail() {
    if (!token) return;
    setLoading(true);
    api
      .getAdminUserDetail(token, userId)
      .then(setDetail)
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadDetail(); }, [userId]);

  async function handleRefund(paymentId: string) {
    if (!token) return;
    setRefundingId(paymentId);
    setError(null);
    setSuccess(null);
    try {
      await api.adminRefund(token, paymentId, { reason: "requested_by_customer" });
      setSuccess("Refund issued successfully.");
      loadDetail();
      onAction();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Refund failed");
    } finally {
      setRefundingId(null);
    }
  }

  async function handleCancelSubscription(subId: string) {
    if (!token) return;
    setCancelingSubId(subId);
    setError(null);
    setSuccess(null);
    try {
      await api.adminCancelSubscription(token, subId, { immediately: false });
      setSuccess("Subscription scheduled for cancellation at period end.");
      loadDetail();
      onAction();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Cancellation failed");
    } finally {
      setCancelingSubId(null);
    }
  }

  async function handleSuspend() {
    if (!token || !suspendReason.trim()) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.adminSuspendUser(token, userId, { reason: suspendReason });
      setSuccess("User suspended successfully.");
      setShowSuspendInput(false);
      setSuspendReason("");
      loadDetail();
      onAction();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Suspension failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnsuspend() {
    if (!token) return;
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.adminUnsuspendUser(token, userId);
      setSuccess("User unsuspended successfully.");
      loadDetail();
      onAction();
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Failed to unsuspend");
    } finally {
      setActionLoading(false);
    }
  }

  const isSuspended = !!detail?.user.suspended_at;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-2xl rounded-xl max-h-[90vh] overflow-y-auto"
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
          <span
            className="font-mono text-[11px] uppercase tracking-wide font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
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

          {/* Feedback messages */}
          {error && (
            <div
              className="text-[13px] rounded-md px-3 py-2"
              style={{
                color: "var(--status-failed, #EF4444)",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              ✗ {error}
            </div>
          )}
          {success && (
            <div
              className="text-[13px] rounded-md px-3 py-2"
              style={{
                color: "var(--status-succeeded, #22c55e)",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              ✓ {success}
            </div>
          )}

          {detail && (
            <>
              {/* User info + suspension badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
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
                    <p className="font-mono text-[11px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Joined {timeAgo(detail.user.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {detail.user.is_admin && (
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
                    >
                      admin
                    </span>
                  )}
                  {isSuspended && (
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}
                    >
                      suspended
                    </span>
                  )}
                </div>
              </div>

              {/* Suspension info banner */}
              {isSuspended && (
                <div
                  className="rounded-lg p-4"
                  style={{
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <p
                    className="font-mono text-[11px] uppercase tracking-wide mb-1"
                    style={{ color: "#EF4444" }}
                  >
                    Suspended
                  </p>
                  <p className="text-[13px]" style={{ color: "#EF4444" }}>
                    {detail.user.suspension_reason}
                  </p>
                </div>
              )}

              {/* ── Account status: suspend / unsuspend ─────────────────── */}
              {!detail.user.is_admin && (
                <div
                  className="rounded-lg p-4 space-y-3"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <h4
                    className="font-mono text-[11px] uppercase tracking-widest font-semibold"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Account status
                  </h4>

                  {isSuspended ? (
                    <button
                      onClick={handleUnsuspend}
                      disabled={actionLoading}
                      className="w-full py-2 rounded-md text-[13px] font-semibold transition-opacity disabled:opacity-50"
                      style={{ background: "var(--accent)", color: "white" }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                    >
                      {actionLoading ? "Processing..." : "Unsuspend user"}
                    </button>
                  ) : showSuspendInput ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Reason for suspension..."
                        value={suspendReason}
                        onChange={e => setSuspendReason(e.target.value)}
                        className="input-base w-full px-3 py-2 rounded-md text-[13px] font-mono"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSuspend}
                          disabled={!suspendReason.trim() || actionLoading}
                          className="flex-1 py-2 rounded-md text-[13px] font-semibold transition-opacity disabled:opacity-50"
                          style={{ background: "#EF4444", color: "white" }}
                        >
                          {actionLoading ? "Suspending..." : "Confirm suspension"}
                        </button>
                        <button
                          onClick={() => { setShowSuspendInput(false); setSuspendReason(""); }}
                          className="btn-ghost px-4 py-2 rounded-md text-[13px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSuspendInput(true)}
                      className="w-full py-2 rounded-md text-[13px] font-semibold transition-colors"
                      style={{
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: "#EF4444",
                        background: "transparent",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      Suspend user
                    </button>
                  )}
                </div>
              )}

              {/* ── Subscriptions ────────────────────────────────────────── */}
              {detail.subscriptions.length > 0 && (
                <div>
                  <h4
                    className="font-mono text-[11px] font-semibold uppercase tracking-widest mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Subscriptions
                  </h4>
                  <div className="space-y-2">
                    {detail.subscriptions.map(s => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                      >
                        <div>
                          <span className="font-semibold text-[13px]" style={{ color: "var(--text-primary)" }}>
                            {s.plan_name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StatusPill status={s.status} />
                            {s.cancel_at_period_end && (
                              <span
                                className="font-mono text-[10px]"
                                style={{ color: "var(--text-muted)" }}
                              >
                                cancels at period end
                              </span>
                            )}
                          </div>
                        </div>
                        {["active", "trialing", "past_due"].includes(s.status) &&
                          !s.cancel_at_period_end && (
                            <button
                              onClick={() => handleCancelSubscription(s.id)}
                              disabled={cancelingSubId === s.id}
                              className="text-[11px] font-mono px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                              style={{
                                color: "#EF4444",
                                border: "1px solid rgba(239,68,68,0.3)",
                                background: "transparent",
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              {cancelingSubId === s.id ? "Canceling..." : "Cancel"}
                            </button>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Stripe payments ──────────────────────────────────────── */}
              {detail.stripePayments.length > 0 && (
                <div>
                  <h4
                    className="font-mono text-[11px] font-semibold uppercase tracking-widest mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Card Payments ({detail.stripePayments.length})
                  </h4>
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    {detail.stripePayments.map(p => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}
                      >
                        <div className="flex items-center gap-3">
                          <StatusPill status={p.status} />
                          <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {timeAgo(p.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="font-semibold tabular-nums text-[13px]"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {formatStripeAmount(p.amount, p.currency)}
                          </span>
                          {p.status === "succeeded" && (
                            <button
                              onClick={() => handleRefund(p.id)}
                              disabled={refundingId === p.id}
                              className="text-[11px] font-mono px-2 py-1 rounded transition-colors disabled:opacity-50"
                              style={{
                                color: "#EF4444",
                                border: "1px solid rgba(239,68,68,0.3)",
                                background: "transparent",
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              {refundingId === p.id ? "..." : "Refund"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── M-Pesa payments ──────────────────────────────────────── */}
              {detail.mpesaPayments.length > 0 && (
                <div>
                  <h4
                    className="font-mono text-[11px] font-semibold uppercase tracking-widest mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    M-Pesa Payments ({detail.mpesaPayments.length})
                  </h4>
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    {detail.mpesaPayments.map(p => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-elevated)" }}
                      >
                        <div className="flex items-center gap-3">
                          <StatusPill status={p.status} />
                          <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {timeAgo(p.created_at)}
                          </span>
                        </div>
                        <span
                          className="font-semibold tabular-nums text-[13px]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {formatMpesaAmount(p.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {detail.stripePayments.length === 0 &&
                detail.mpesaPayments.length === 0 &&
                detail.subscriptions.length === 0 && (
                  <p className="text-[13px] text-center py-4" style={{ color: "var(--text-muted)" }}>
                    No payments or subscriptions yet.
                  </p>
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
      .then(res => { setUsers(res.users); setTotal(res.total); })
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
          <h2
            className="font-mono text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            All Users{" "}
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>{total}</span>
          </h2>
          <input
            type="text"
            placeholder="Search email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
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
                  {["User", "Joined", "Payments", "Subscription", "Total Spent", ""].map(h => (
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
                {users.map(u => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-row-hover)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <div
                        className="font-semibold flex items-center gap-1.5"
                        style={{ color: "var(--text-primary)" }}
                      >
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
                      <div
                        className="text-[11px] font-mono font-medium"
                        style={{ color: "var(--text-muted)" }}
                      >
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
                          <div
                            className="font-mono text-[10px] font-medium mt-0.5"
                            style={{ color: "var(--text-muted)" }}
                          >
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost px-3 py-1 text-[12px] disabled:opacity-30"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
          onAction={load}
        />
      )}
    </>
  );
}