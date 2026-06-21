import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth";
import { api,type AdminUser,type  AdminUserDetail, ApiError } from "../../lib/api";
import { formatStripeAmount, formatMpesaAmount, timeAgo } from "../../lib/format";
import { StatusPill } from "../Statuspill";

function UserDetailModal({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
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
    <div className="fixed inset-0 bg-[#0E1116]/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-[#F7F5F0] rounded-xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#F7F5F0] border-b border-[#E5E2DA] px-5 py-4 flex items-center justify-between">
          <span className="font-mono text-[11px] text-[#8B8578] uppercase tracking-wide">
            User detail
          </span>
          <button
            onClick={onClose}
            className="text-[#8B8578] hover:text-[#0E1116] text-xl"
          >
            &times;
          </button>
        </div>

        <div className="p-5 space-y-6">
          {loading && <p className="text-[13px] text-[#8B8578]">Loading...</p>}

          {detail && (
            <>
              {/* User info */}
              <div>
                <h3 className="font-serif text-xl text-[#0E1116]">
                  {detail.user.name}
                </h3>
                <p className="font-mono text-[12px] text-[#8B8578]">
                  {detail.user.email}
                </p>
                <p className="font-mono text-[11px] text-[#8B8578] mt-1">
                  Joined {timeAgo(detail.user.created_at)}
                  {detail.user.is_admin && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-[#f5f3ff] text-[#7c3aed] border border-[#c4b5fd]/40">
                      admin
                    </span>
                  )}
                </p>
              </div>

              {/* Subscriptions */}
              {detail.subscriptions.length > 0 && (
                <div>
                  <h4 className="font-mono text-[11px] uppercase tracking-widest text-[#8B8578] mb-3">
                    Subscriptions
                  </h4>
                  <div className="space-y-2">
                    {detail.subscriptions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-[#E5E2DA] bg-white"
                      >
                        <div>
                          <span className="font-medium text-[13px] text-[#0E1116]">
                            {s.plan_name}
                          </span>
                          <span className="ml-2 font-mono text-[12px] text-[#8B8578]">
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
                  <h4 className="font-mono text-[11px] uppercase tracking-widest text-[#8B8578] mb-3">
                    Card Payments ({detail.stripePayments.length})
                  </h4>
                  <div className="space-y-1">
                    {detail.stripePayments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-2 border-b border-[#F0EEE9] last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <StatusPill status={p.status} />
                          <span className="font-mono text-[11px] text-[#8B8578]">
                            {timeAgo(p.created_at)}
                          </span>
                        </div>
                        <span className="font-serif tabular-nums text-[13px] text-[#0E1116]">
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
                  <h4 className="font-mono text-[11px] uppercase tracking-widest text-[#8B8578] mb-3">
                    M-Pesa Payments ({detail.mpesaPayments.length})
                  </h4>
                  <div className="space-y-1">
                    {detail.mpesaPayments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between py-2 border-b border-[#F0EEE9] last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <StatusPill status={p.status} />
                          <span className="font-mono text-[11px] text-[#8B8578]">
                            {timeAgo(p.created_at)}
                          </span>
                        </div>
                        <span className="font-serif tabular-nums text-[13px] text-[#0E1116]">
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
      <div className="bg-white rounded-xl border border-[#E5E2DA] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E2DA] flex items-center justify-between gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-[#8B8578]">
            All Users
            <span className="ml-2 text-[#0E1116]">{total}</span>
          </h2>
          <input
            type="text"
            placeholder="Search email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-md border border-[#E5E2DA] text-[12px] font-mono focus:outline-none focus:border-[#0E1116] w-44"
          />
        </div>

        {loading ? (
          <p className="text-[13px] text-[#8B8578] px-5 py-8">Loading...</p>
        ) : error ? (
          <p className="text-[13px] text-[#C9402E] px-5 py-8">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#E5E2DA] bg-[#F7F5F0]">
                  {["User", "Joined", "Payments", "Subscription", "Total Spent", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-widest text-[#8B8578]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EEE9]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAFAF8]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#0E1116] flex items-center gap-1.5">
                        {u.name}
                        {u.is_admin && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#f5f3ff] text-[#7c3aed] border border-[#c4b5fd]/40">
                            admin
                          </span>
                        )}
                      </div>
                      <div className="text-[#8B8578] text-[11px] font-mono">
                        {u.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#8B8578]">
                      {timeAgo(u.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#8B8578]">
                      {parseInt(String(u.stripe_payment_count), 10) +
                        parseInt(String(u.mpesa_payment_count), 10)}{" "}
                      payments
                    </td>
                    <td className="px-4 py-3">
                      {u.subscription_status ? (
                        <div>
                          <StatusPill status={u.subscription_status} />
                          <div className="font-mono text-[10px] text-[#8B8578] mt-0.5">
                            {u.plan_name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#8B8578] text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-serif tabular-nums text-[13px] text-[#0E1116]">
                      <div>{formatStripeAmount(parseInt(String(u.stripe_total_cents), 10), "usd")}</div>
                      {parseInt(String(u.mpesa_total_kes), 10) > 0 && (
                        <div className="text-[11px] text-[#8B8578]">
                          + {formatMpesaAmount(parseInt(String(u.mpesa_total_kes), 10))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedUserId(u.id)}
                        className="font-mono text-[11px] text-[#3b82f6] hover:underline"
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
                      className="px-4 py-8 text-center text-[13px] text-[#8B8578]"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[#E5E2DA] flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#8B8578]">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-[#E5E2DA] text-[12px] disabled:opacity-40 hover:border-[#0E1116] transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-[#E5E2DA] text-[12px] disabled:opacity-40 hover:border-[#0E1116] transition-colors"
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