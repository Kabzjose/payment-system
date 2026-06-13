import { loadStripe, Stripe } from "@stripe/stripe-js";

// Replace with YOUR publishable key from the Stripe dashboard (Developers → API keys)
// This key is safe to expose in frontend code — it can only create charges, never read data
const STRIPE_PUBLISHABLE_KEY = "pk_test_REPLACE_ME";

let stripePromise: Promise<Stripe | null> | null = null;

// loadStripe() is expensive — call it once and cache the promise.
// Every component that needs Stripe imports getStripe() and gets the same instance.
export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}