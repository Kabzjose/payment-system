import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";

export function useAdminStats() {
  const { token } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getAdminStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api
      .getAdminStats(token)
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : "Failed to load stats")
      )
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, refresh };
}