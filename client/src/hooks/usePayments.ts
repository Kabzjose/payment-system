import { useState, useCallback, useEffect } from "react";
import { api, type  StripePayment, type MpesaPayment,type UnifiedPayment, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

interface UsePaymentsReturn {
  stripePayments: StripePayment[];
  mpesaPayments: MpesaPayment[];
  unified: UnifiedPayment[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePayments(): UsePaymentsReturn {
  const { token } = useAuth();
  const [stripePayments, setStripePayments] = useState<StripePayment[]>([]);
  const [mpesaPayments, setMpesaPayments] = useState<MpesaPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    // Fetch both in parallel — Promise.allSettled means one failing
    // doesn't cancel the other. You still see Stripe payments even
    // if the M-Pesa endpoint is temporarily broken, and vice versa.
    Promise.allSettled([
      api.getStripePayments(token),
      api.getMpesaPayments(token),
    ]).then(([stripeResult, mpesaResult]) => {
      if (stripeResult.status === "fulfilled") {
        setStripePayments(stripeResult.value);
      } else {
        console.error("Stripe payments fetch failed:", stripeResult.reason);
      }

      if (mpesaResult.status === "fulfilled") {
        setMpesaPayments(mpesaResult.value);
      } else {
        console.error("M-Pesa payments fetch failed:", mpesaResult.reason);
      }

      // Only show an error if BOTH failed
      if (
        stripeResult.status === "rejected" &&
        mpesaResult.status === "rejected"
      ) {
        const err = stripeResult.reason;
        setError(err instanceof ApiError ? err.message : "Failed to load payments");
      }
    }).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Merge both lists, tag each with source, sort by date descending
  const unified: UnifiedPayment[] = [
    ...stripePayments.map((p) => ({ ...p, source: "stripe" as const })),
    ...mpesaPayments.map((p) => ({ ...p, source: "mpesa" as const })),
  ].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { stripePayments, mpesaPayments, unified, loading, error, refresh };
}