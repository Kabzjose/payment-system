import { useState, type FormEvent } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "../../lib/stripe";
import { useAuth } from "../../lib/auth";
import { useTheme } from "../../lib/theme";
import { api, ApiError } from "../../lib/api";

function useCardElementOptions() {
  const { theme } = useTheme();
  return {
    style: {
      base: {
        fontSize: "15px",
        fontFamily: '"IBM Plex Mono", monospace',
        color: theme === "dark" ? "#F1F5F9" : "#0F172A",
        "::placeholder": { color: theme === "dark" ? "#475569" : "#94A3B8" },
        backgroundColor: "transparent",
      },
      invalid: { color: "#F87171" },
    },
  };
}

function CardPaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const { token } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const cardOptions = useCardElementOptions();

  const [amount, setAmount] = useState("20.00");
  const [submitting, setSubmitting] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !token || !cardReady) return;
    const card = elements.getElement(CardElement);
    if (!card) { setMessage({ type: "error", text: "Card field not ready." }); return; }
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents < 50) { setMessage({ type: "error", text: "Minimum amount is $0.50" }); return; }
    setSubmitting(true);
    setMessage(null);
    try {
      const { clientSecret } = await api.createPaymentIntent(token, { amount: cents, currency: "usd" });
      const result = await stripe.confirmCardPayment(clientSecret, { payment_method: { card } });
      if (result.error) {
        setMessage({ type: "error", text: result.error.message ?? "Payment failed" });
      } else if (result.paymentIntent?.status === "succeeded") {
        setMessage({ type: "success", text: "Payment succeeded! Redirecting..." });
        card.clear();
        setAmount("20.00");
        setTimeout(() => onSuccess(), 2500);
      } else {
        setMessage({ type: "error", text: `Unexpected status: ${result.paymentIntent?.status}` });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof ApiError ? err.message : "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="card-amount" className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-semibold" style={{ color: "var(--text-muted)" }}>$</span>
          <input id="card-amount" type="text" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-base pl-8 text-lg font-mono" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Card Details</label>
        <div className="stripe-element-container">
          <CardElement options={cardOptions} onReady={() => setCardReady(true)} onFocus={() => setMessage(null)} />
        </div>
        <p className="mt-2 text-[11px] font-mono" style={{ color: "var(--text-label)" }}>
          {cardReady ? "🔒 Test: 4242 4242 4242 4242 · any future date · any CVC" : "Loading secure card fields..."}
        </p>
      </div>
      {message && (
        <div className="flex items-start gap-3 rounded-lg px-4 py-3.5 text-sm slide-up"
          style={message.type === "success"
            ? { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34D399" }
            : { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>
          <span className="shrink-0">{message.type === "success" ? "✓" : "✗"}</span>
          <span>{message.text}</span>
        </div>
      )}
      <button type="submit" id="card-submit" disabled={!stripe || !cardReady || submitting} className="btn-primary w-full py-3 text-sm">
        {!cardReady ? "Loading..." : submitting
          ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</span>
          : `Pay $${amount || "0.00"}`}
      </button>
    </form>
  );
}

export function CardPage({ onSuccess }: { onSuccess: () => void }) {
  return (
    <div className="max-w-4xl mx-auto fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Card Payment</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Secure payment powered by Stripe</p>
      </div>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="rounded-xl p-6 lg:p-8" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-muted)", color: "#818CF8" }}>💳</div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Credit / Debit Card</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Visa, Mastercard, Amex supported</p>
            </div>
          </div>
          <Elements stripe={getStripe()}>
            <CardPaymentForm onSuccess={onSuccess} />
          </Elements>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: "#10B981" }}>🔒</span>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Secure & Encrypted</p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Your card details are transmitted directly to Stripe using 256-bit TLS encryption. We never store or see your card number.
            </p>
          </div>
          <div className="rounded-xl p-5" style={{ background: "var(--accent-muted)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "#818CF8" }}>Test Mode</p>
            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              4242 4242 4242 4242<br />Any future date · Any 3-digit CVC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
