import { useState, useMemo } from "react";
import { type UnifiedPayment, type StripePayment, type MpesaPayment } from "../../lib/api";
import { formatStripeAmount, formatMpesaAmount, formatDate } from "../../lib/format";
import { StatusBadge } from "../ui/StatusBadge";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";
import { EmptyState } from "../ui/EmptyState";
import { StripeDetail } from "../modals/StripeDetail";
import { MpesaDetail } from "../modals/MpesaDetail";
import { type Page } from "../layout/Sidebar";

type FilterSource = "all" | "stripe" | "mpesa";
type FilterStatus = "all" | "succeeded" | "failed" | "processing" | "pending";
type SortDir = "desc" | "asc";

const PAGE_SIZE = 20;

interface HistoryPageProps {
  payments: UnifiedPayment[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onNavigate: (page: Page) => void;
}

export function HistoryPage({ payments, loading, error, onRefresh, onNavigate }: HistoryPageProps) {
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<FilterSource>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [selectedStripe, setSelectedStripe] = useState<string | null>(null);
  const [selectedMpesa, setSelectedMpesa] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...payments];
    if (filterSource !== "all") list = list.filter(p => p.source === filterSource);
    if (filterStatus !== "all") list = list.filter(p => p.status === filterStatus);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.id.toLowerCase().includes(q) ||
        (p.source === "mpesa" && (p as MpesaPayment).phone_number?.includes(q)));
    }
    list.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortDir === "desc" ? diff : -diff;
    });
    return list;
  }, [payments, filterSource, filterStatus, search, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeFilter(src?: FilterSource, status?: FilterStatus) {
    if (src !== undefined) setFilterSource(src);
    if (status !== undefined) setFilterStatus(status);
    setPage(1);
  }

  const FilterBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={active
        ? { background: "var(--accent-muted)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.3)" }
        : { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
      {label}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Transaction History</h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {filtered.length} of {payments.length} transactions
          </p>
        </div>
        <button onClick={onRefresh} className="btn-ghost text-xs gap-1.5">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Search + filters */}
      <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <input id="history-search" type="text" placeholder="Search by ID or phone number..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-base text-sm" />
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-mono self-center" style={{ color: "var(--text-label)" }}>Source:</span>
          <FilterBtn label="All" active={filterSource === "all"} onClick={() => changeFilter("all")} />
          <FilterBtn label="Card" active={filterSource === "stripe"} onClick={() => changeFilter("stripe")} />
          <FilterBtn label="M-Pesa" active={filterSource === "mpesa"} onClick={() => changeFilter("mpesa")} />
          <span className="text-xs font-mono self-center ml-2" style={{ color: "var(--text-label)" }}>Status:</span>
          <FilterBtn label="All" active={filterStatus === "all"} onClick={() => changeFilter(undefined, "all")} />
          <FilterBtn label="Succeeded" active={filterStatus === "succeeded"} onClick={() => changeFilter(undefined, "succeeded")} />
          <FilterBtn label="Failed" active={filterStatus === "failed"} onClick={() => changeFilter(undefined, "failed")} />
          <FilterBtn label="Processing" active={filterStatus === "processing"} onClick={() => changeFilter(undefined, "processing")} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        {/* Column headers */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-label)", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
          <span>Method</span>
          <span>Transaction ID</span>
          <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
            className="flex items-center gap-1 transition-colors hover:opacity-80">
            Date {sortDir === "desc" ? "↓" : "↑"}
          </button>
          <span>Status</span>
          <span className="text-right">Amount</span>
        </div>

        {loading ? <LoadingSkeleton variant="table" /> : error ? (
          <div className="py-12 text-center">
            <p className="text-sm mb-3" style={{ color: "#F87171" }}>{error}</p>
            <button onClick={onRefresh} className="btn-ghost text-xs">Try again</button>
          </div>
        ) : paginated.length === 0 ? (
          filtered.length === 0 && payments.length === 0 ? (
            <EmptyState icon="📋" title="No transactions yet"
              description="Make your first payment to see your history here."
              action={{ label: "Make a payment", onClick: () => onNavigate("card") }} />
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No transactions match your filters.</p>
              <button onClick={() => { setSearch(""); setFilterSource("all"); setFilterStatus("all"); }} className="btn-ghost text-xs mt-2">Clear filters</button>
            </div>
          )
        ) : (
          <>
            {paginated.map((p) => {
              const isStripe = p.source === "stripe";
              const amount = isStripe
                ? formatStripeAmount((p as StripePayment).amount, (p as StripePayment).currency)
                : formatMpesaAmount((p as MpesaPayment).amount);
              return (
                <button key={`${p.source}-${p.id}`}
                  onClick={() => { if (p.source === "stripe") setSelectedStripe(p.id); else setSelectedMpesa(p.id); }}
                  className="w-full grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center px-5 py-3.5 text-left transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-row-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded"
                    style={isStripe
                      ? { background: "rgba(99,102,241,0.12)", color: "#818CF8" }
                      : { background: "rgba(16,185,129,0.12)", color: "#34D399" }}>
                    {isStripe ? "CARD" : "MPESA"}
                  </span>
                  <span className="text-xs font-mono truncate" style={{ color: "var(--text-muted)" }}>{p.id}</span>
                  <span className="text-xs font-mono whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{formatDate(p.created_at)}</span>
                  <StatusBadge status={p.status} size="sm" />
                  <span className="text-sm font-mono font-semibold tabular-nums text-right" style={{ color: "var(--text-primary)" }}>{amount}</span>
                </button>
              );
            })}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs px-3 py-1.5">← Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost text-xs px-3 py-1.5">Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedStripe && <StripeDetail paymentId={selectedStripe} onClose={() => setSelectedStripe(null)} onRefunded={onRefresh} />}
      {selectedMpesa && <MpesaDetail paymentId={selectedMpesa} onClose={() => setSelectedMpesa(null)} />}
    </div>
  );
}
