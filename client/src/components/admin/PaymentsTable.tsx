import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../lib/auth";
import { api, type AdminPayment, ApiError } from "../../lib/api";
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
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          All Payments{" "}
          <span className="font-bold" style={{ color: "var(--text-primary)" }}>{total}</span>
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-base px-3 py-1.5 text-[12px] font-mono w-40"
          />
          <select
            value={method}
            onChange={(e) => { setMethod(e.target.value); setPage(1); }}
            className="input-base px-3 py-1.5 text-[12px] font-mono"
          >
            <option value="">All methods</option>
            <option value="card">Card</option>
            <option value="mpesa">M-Pesa</option>
          </select>
        </div>
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
                {["User", "Amount", "Method", "Status", "Date"].map((h) => (
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
              {payments.map((p) => (
                <tr
                  key={`${p.method}-${p.id}`}
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-row-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{p.user_name}</div>
                    <div className="text-[11px] font-mono font-medium" style={{ color: "var(--text-muted)" }}>{p.user_email}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {formatAmount(p)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={
                        p.method === "card"
                          ? { background: "rgba(99,102,241,0.1)", color: "#818CF8" }
                          : { background: "rgba(245,158,11,0.1)", color: "#F59E0B" }
                      }
                    >
                      {p.method === "card" ? "CARD" : "MPESA"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                    {timeAgo(p.created_at)}
                  </td>
                </tr>
              ))}

              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
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
  );
}