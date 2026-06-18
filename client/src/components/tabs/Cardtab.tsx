import { useState,type  FormEvent } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "../../lib/stripe";
import { useAuth } from "../../lib/auth";
import { api, ApiError } from "../../lib/api";

const CARD_ELEMENT_OPTIONS = {
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

function CardTabInner({ onSuccess }: { onSuccess: () => void }) {
  const { token } = useAuth();
  const stripe = useStripe();
  const elements = useElements();

  const [amount, setAmount] = useState("20.00");
  const [submitting, setSubmitting] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !token || !cardReady) return;

    // Get the element fresh at submit time
    const card = elements.getElement(CardElement);
    if (!card) {
      setMessage({ type: "error", text: "Card field not ready — please wait a moment." });
      return;
    }

    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents < 50) {
      setMessage({ type: "error", text: "Minimum amount is $0.50" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const { clientSecret } = await api.createPaymentIntent(token, {
        amount: cents,
        currency: "usd",
      });

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        setMessage({ type: "error", text: result.error.message ?? "Payment failed" });
      } else if (result.paymentIntent?.status === "succeeded") {
        setMessage({ type: "success", text: "Payment succeeded" });
        card.clear();
        setAmount("20.00");
        setTimeout(() => onSuccess(), 4000);
        onSuccess();
      } else {
        setMessage({
          type: "error",
          text: `Unexpected status: ${result.paymentIntent?.status}`,
        });
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
    <div className="max-w-md">
      <p className="text-[13px] text-[#8B8578] mb-6">
        Pay with a credit or debit card. Your card details go directly to
        Stripe — your server never sees them.
      </p>

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
          <div className="px-3 py-3.5 rounded-md border border-[#D9D5CC] bg-white">
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onReady={() => setCardReady(true)}
              onFocus={() => setMessage(null)}
            />
          </div>
          <p className="mt-1.5 text-[11px] font-mono text-[#8B8578]">
            {cardReady
              ? "Test card: 4242 4242 4242 4242 · any future date · any CVC"
              : "Loading card fields..."}
          </p>
        </div>

        {message && (
          <div
            className={`text-[13px] rounded-md px-3 py-2.5 border ${
              message.type === "success"
                ? "text-[#2D6A4F] bg-[#2D6A4F]/8 border-[#2D6A4F]/20"
                : "text-[#C9402E] bg-[#C9402E]/8 border-[#C9402E]/20"
            }`}
          >
            {message.type === "success" ? "✓ " : "✗ "}
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || !cardReady || submitting}
          className="w-full py-2.5 rounded-md bg-[#0E1116] text-[#F7F5F0] text-[14px] font-medium hover:bg-[#1a1f28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!cardReady
            ? "Loading..."
            : submitting
            ? "Processing..."
            : `Pay $${amount || "0.00"}`}
        </button>
      </form>
    </div>
  );
}

export function CardTab({ onSuccess }: { onSuccess: () => void }) {
  return (
    <Elements stripe={getStripe()}>
      <CardTabInner onSuccess={onSuccess} />
    </Elements>
  );
}