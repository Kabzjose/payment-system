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
      color: "#0E1116",
      "::placeholder": { color: "#8B8578" },
    },
    invalid: { color: "#C9402E" },
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
        <label className="block text-[12px] font-mono text-[#6B665C] mb-1.5">
          Amount (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-lg text-[#0E1116]">
            $
          </span>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-7 pr-3 py-2.5 rounded-md border border-[#D9D5CC] bg-white font-serif text-lg focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-mono text-[#6B665C] mb-1.5">
          Card details
        </label>
        <div className="px-3 py-3 rounded-md border border-[#D9D5CC] bg-white">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="mt-1.5 text-[11px] font-mono text-[#8B8578]">
          Test: 4242 4242 4242 4242 · any future date · any CVC
        </p>
      </div>

      {message && (
        <div
          className={`text-[13px] rounded-md px-3 py-2 border ${
            message.type === "success"
              ? "text-[#2D6A4F] bg-[#2D6A4F]/8 border-[#2D6A4F]/20"
              : "text-[#C9402E] bg-[#C9402E]/8 border-[#C9402E]/20"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full py-2.5 rounded-md bg-[#0E1116] text-[#F7F5F0] text-[14px] font-medium hover:bg-[#1a1f28] transition-colors disabled:opacity-50"
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