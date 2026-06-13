import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../lib/auth";
import { api, type PaymentIntent, ApiError } from "../lib/api";
import { PaymentForm } from "./Paymentform";
import { PaymentRow } from "./Paymentrow";
import { PaymentDetail } from "./Paymentdetail";

export function Dashboard() {
  const { user, token, logout } = useAuth();
  const [payments, setPayments] = useState<PaymentIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadPayments = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api
      .getPayments(token)
      .then(setPayments)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load payments"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Total of all succeeded payments — shown in the header as a running balance
  const totalCollected = payments
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="border-b border-[#E2E8F0] px-4 sm:px-8 py-5 flex items-center justify-between bg-[#FFFFFF]">
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-[#64748B] uppercase mb-1">
            Ledger
          </div>
          <div className="font-serif text-[#1E293B] text-lg">{user?.name}</div>
        </div>
        <button
          onClick={logout}
          className="text-[12px] font-mono text-[#64748B] hover:text-[#3B82F6] transition-colors"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* New payment composer */}
        <section className="bg-[#FFFFFF] rounded-lg p-5 border border-[#E2E8F0]">
          <h2 className="font-mono text-[11px] tracking-[0.15em] text-[#64748B] uppercase mb-4">
            New payment
          </h2>
          <PaymentForm onSuccess={loadPayments} />
        </section>

        {/* Ledger */}
        <section className="bg-[#FFFFFF] rounded-lg overflow-hidden border border-[#E2E8F0]">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <h2 className="font-mono text-[11px] tracking-[0.15em] text-[#64748B] uppercase">
              Transaction history
            </h2>
            <span className="font-mono text-[11px] text-[#64748B]">
              {totalCollected > 0
                ? `${(totalCollected / 100).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  })} total`
                : ""}
            </span>
          </div>

          {loading && (
            <p className="text-[13px] text-[#64748B] px-5 py-6">Loading...</p>
          )}

          {error && !loading && (
            <p className="text-[13px] text-[#DC2626] px-5 py-6">{error}</p>
          )}

          {!loading && !error && payments.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-[#64748B]">
                No payments yet. Make your first one above.
              </p>
            </div>
          )}

          {!loading &&
            payments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onClick={() => setSelectedId(payment.id)}
              />
            ))}
        </section>
      </main>

      {selectedId && (
        <PaymentDetail
          paymentId={selectedId}
          onClose={() => setSelectedId(null)}
          onRefunded={loadPayments}
        />
      )}
    </div>
  );
}