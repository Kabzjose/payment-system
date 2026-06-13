const BASE_URL = import.meta.env.VITE_API_URL ||"http://localhost:3000";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface Transaction {
  id: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  type: "charge" | "refund" | "partial_refund";
  status: string;
  created_at: string;
}

export interface PaymentWithTransactions extends PaymentIntent {
  transactions: Transaction[];
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// Reads the token from wherever the app stores it.
// Passed in by the caller so this file has no dependency on React state.
async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(rest.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });
  const data = await res.json();

  if (!data.success) {
    throw new ApiError(data.error ?? "Request failed", res.status);
  }

  return data.data as T;
}

export const api = {
  register(payload: { email: string; name: string; password: string }) {
    return request<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login(payload: { email: string; password: string }) {
    return request<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  me(token: string) {
    return request<{ user: User }>("/auth/me", { token });
  },

  createPaymentIntent(
    token: string,
    payload: { amount: number; currency: string; metadata?: Record<string, string> }
  ) {
    return request<{ paymentIntent: PaymentIntent; clientSecret: string }>(
      "/payments",
      { method: "POST", body: JSON.stringify(payload), token }
    );
  },

  getPayments(token: string) {
    return request<PaymentIntent[]>("/payments", { token });
  },

  getPayment(token: string, id: string) {
    return request<PaymentWithTransactions>(`/payments/${id}`, { token });
  },

  refund(token: string, id: string, payload?: { amount?: number; reason?: string }) {
    return request<Transaction>(`/payments/${id}/refund`, {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
      token,
    });
  },
};

export { ApiError };