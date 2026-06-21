import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth";
import { api,type AdminPayment, ApiError } from "../../lib/api";
import { formatStripeAmount, formatMpesaAmount, timeAgo } from "../../lib/format";
import { StatusPill } from "../Statuspill";

export function PaymentsTable() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api
      .getAdminPayments(token, { page, search, method: method || undefined })
      .then((res) => { setPayments(res.payments); setTotal(res.total); })
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [token, page, search, method]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 20);

  function formatAmount(p: AdminPayment) {
    if (p.method === "mpesa") return formatMpesaAmount(p.amount / 100);
    return formatStripeAmount(p.amount, p.currency);
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E2DA] overflow-hidden">
      {/* Table header */}
      <div className="px-5 py-4 border-b border-[#E5E2DA] flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-[#8B8578]">
          All Payments
          <span className="ml-2 text-[#0E1116]">{total}</span>
        </h2>
        <div className="flex items-center gap-2">
          {/* Search */}
          <input
            type="text"
            placeholder="Search email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-md border border-[#E5E2DA] text-[12px] font-mono focus:outline-none focus:border-[#0E1116] w-40"
          />
          {/* Method filter */}
          <select
            value={method}
            onChange={(e) => { setMethod(e.target.value); setPage(1); }}
            className="px-3 py-1.5 rounded-md border border-[#E5E2DA] text-[12px] font-mono focus:outline-none focus:border-[#0E1116]"
          >
            <option value="">All methods</option>
            <option value="card">Card</option>
            <option value="mpesa">M-Pesa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-[13px] text-[#8B8578] px-5 py-8">Loading...</p>
      ) : error ? (
        <p className="text-[13px] text-[#C9402E] px-5 py-8">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E5E2DA] bg-[#F7F5F0]">
                {["User", "Amount", "Method", "Status", "Date"].map((h) => (
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
              {payments.map((p) => (
                <tr key={`${p.method}-${p.id}`} className="hover:bg-[#FAFAF8]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#0E1116]">{p.user_name}</div>
                    <div className="text-[#8B8578] text-[11px] font-mono">{p.user_email}</div>
                  </td>
                  <td className="px-4 py-3 font-serif tabular-nums text-[#0E1116]">
                    {formatAmount(p)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      p.method === "card"
                        ? "bg-[#eff6ff] text-[#3b82f6] border border-[#93c5fd]/40"
                        : "bg-[#fffbeb] text-[#9C7A1F] border border-[#fcd34d]/40"
                    }`}>
                      {p.method === "card" ? "CARD" : "MPESA"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#8B8578]">
                    {timeAgo(p.created_at)}
                  </td>
                </tr>
              ))}

              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-[#8B8578]">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
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
  );
}