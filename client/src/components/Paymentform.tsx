import { useState,type FormEvent } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "../lib/stripe";
import { useAuth } from "../lib/auth";
import { api, ApiError } from "../lib/api";

const cardElementOptions = {
  style: {
    base: {
      fontSize: "14px",
      fontFamily: '"IBM Plex Mono", monospace',
      color: "#1E293B",
      "::placeholder": { color: "#CBD5E1" },
    },
    invalid: { color: "#DC2626" },
  },
};

// Inner component: rendered once Stripe Elements context is available.
// Split out because useStripe() / useElements() must be called
// inside an <Elements> provider.
function PaymentFormInner({ onSuccess }: { onSuccess: () => void }) {
  const { token } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const [amount, setAmount] = useState("20.00");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !token) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setSubmitting(true);
    setMessage(null);

    // Convert dollars (what the user types) to cents (what the backend expects)
    const amountInCents = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountInCents) || amountInCents < 50) {
      setMessage({ type: "error", text: "Minimum amount is $0.50" });
      setSubmitting(false);
      return;
    }

    try {
      // Step 1: ask OUR backend to create a PaymentIntent
      const { clientSecret } = await api.createPaymentIntent(token, {
        amount: amountInCents,
        currency: "usd",
      });

      // Step 2: confirm the payment with Stripe directly using the card details.
      // The card number never touches our backend — only Stripe sees it.
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (result.error) {
        setMessage({ type: "error", text: result.error.message ?? "Payment failed" });
      } else if (result.paymentIntent?.status === "succeeded") {
        setMessage({ type: "success", text: "Payment succeeded" });
        cardElement.clear();
        onSuccess();
      } else {
        setMessage({ type: "error", text: `Unexpected status: ${result.paymentIntent?.status}` });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof ApiError ? err.message : "Something went wrong",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[12px] font-mono text-[#64748B] mb-1.5">
          Amount (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-lg text-[#1E293B]">
            $
          </span>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-7 pr-3 py-2.5 rounded-md border border-[#E2E8F0] bg-[#FFFFFF] font-serif text-lg text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-mono text-[#64748B] mb-1.5">
          Card details
        </label>
        <div className="px-3 py-3 rounded-md border border-[#E2E8F0] bg-[#FFFFFF]">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="mt-1.5 text-[11px] font-mono text-[#64748B]">
          Test: 4242 4242 4242 4242 · any future date · any CVC
        </p>
      </div>

      {message && (
        <div
          className={`text-[13px] rounded-md px-3 py-2 border ${
            message.type === "success"
              ? "text-[#047857] bg-[#ECFDF5] border-[#D1FAE5]"
              : "text-[#DC2626] bg-[#FEE2E2] border-[#FECACA]"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full py-2.5 rounded-md bg-[#3B82F6] text-[#FFFFFF] text-[14px] font-medium hover:bg-[#2563EB] transition-colors disabled:opacity-50"
      >
        {submitting ? "Processing..." : `Pay $${amount || "0.00"}`}
      </button>
    </form>
  );
}

// Wrapper: provides the Stripe Elements context.
// getStripe() returns a cached promise — Elements handles the loading state.
export function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  return (
    <Elements stripe={getStripe()}>
      <PaymentFormInner onSuccess={onSuccess} />
    </Elements>
  );
}