import { useState, useEffect, useCallback } from "react";
import { api,type Subscription, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

interface UseSubscriptionReturn {
  subscription: Subscription | null;  // null = no active subscription
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSubscription(): UseSubscriptionReturn {
  const { token } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    api
      .getUserSubscriptions(token)
      .then((subs) => {
        // Find the most relevant subscription:
        // active/trialing first, then past_due, then most recent
        const active = subs.find((s) =>
          ["active", "trialing", "past_due"].includes(s.status)
        );
        setSubscription(active ?? subs[0] ?? null);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load subscription");
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { subscription, loading, error, refresh };
}