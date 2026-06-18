import { useState, useEffect, useRef } from "react";
import { api, MpesaPayment } from "../lib/api";
import { useAuth } from "../lib/auth";

// Statuses where we stop polling — the payment reached a final state
const TERMINAL_STATUSES = new Set(["succeeded", "failed", "cancelled"]);

const POLL_INTERVAL_MS = 3000;  // poll every 3 seconds
const MAX_POLL_DURATION_MS = 120_000; // stop after 2 minutes

interface UseMpesaPollingReturn {
  payment: MpesaPayment | null;
  polling: boolean;
  elapsed: number; // seconds since polling started — used for countdown UI
  stopPolling: () => void;
}

export function useMpesaPolling(
  initialPayment: MpesaPayment | null
): UseMpesaPollingReturn {
  const { token } = useAuth();
  const [payment, setPayment] = useState<MpesaPayment | null>(initialPayment);
  const [polling, setPolling] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // useRef to hold the interval ID — changing a ref doesn't trigger re-renders
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  function stopPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPolling(false);
  }

  useEffect(() => {
    // Start polling only when we have a payment in a non-terminal state
    if (!initialPayment || !token) return;
    if (TERMINAL_STATUSES.has(initialPayment.status)) return;

    setPayment(initialPayment);
    setPolling(true);
    setElapsed(0);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(async () => {
      // Update elapsed time
      elapsedRef.current += POLL_INTERVAL_MS / 1000;
      setElapsed(elapsedRef.current);

      // Timeout check — stop polling after 2 minutes
      if (Date.now() - (startTimeRef.current ?? 0) > MAX_POLL_DURATION_MS) {
        stopPolling();
        return;
      }

      try {
        const updated = await api.getMpesaPayment(token, initialPayment.id);
        setPayment(updated);

        // If we've reached a terminal status, stop polling
        if (TERMINAL_STATUSES.has(updated.status)) {
          stopPolling();
        }
      } catch {
        // Network hiccup — keep polling, don't crash
        console.warn("M-Pesa poll failed, retrying...");
      }
    }, POLL_INTERVAL_MS);

    // Cleanup on unmount or when initialPayment changes
    return () => stopPolling();
  }, [initialPayment?.id]); // only restart if the payment ID changes

  return { payment, polling, elapsed, stopPolling };
}