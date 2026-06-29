const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
}

// ─── Stripe types ─────────────────────────────────────────────────────────────

export interface StripePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_payment_intent_id: string | null;
  payment_method: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  type: "charge" | "refund" | "partial_refund";
  status: string;
  stripe_charge_id: string | null;
  created_at: string;
}

export interface StripePaymentWithTransactions extends StripePayment {
  transactions: Transaction[];
}

// ─── M-Pesa types ─────────────────────────────────────────────────────────────

export interface MpesaPayment {
  id: string;
  user_id: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc: string;
  checkout_request_id: string | null;
  merchant_request_id: string | null;
  status: "pending" | "processing" | "succeeded" | "failed" | "cancelled";
  mpesa_receipt_number: string | null;
  result_code: number | null;
  result_desc: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Unified history type ─────────────────────────────────────────────────────

export type UnifiedPayment =
  | ({ source: "stripe" } & StripePayment)
  | ({ source: "mpesa" } & MpesaPayment);

// ─── Subscription types ───────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  stripe_price_id: string;
  stripe_product_id: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
  interval_count: number;
  trial_period_days: number;
  active: boolean;
}

// ─── Admin types ──────────────────────────────────────────────────────────────

export interface AdminPayment {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  amount: number;
  currency: string;
  status: string;
  method: "card" | "mpesa";
  created_at: string;
  external_id: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
  stripe_payment_count: number;
  stripe_total_cents: number;
  mpesa_payment_count: number;
  mpesa_total_kes: number;
  subscription_status: string | null;
  plan_name: string | null;
}

export interface AdminUserDetail {
  user: {
    id: string;
    email: string;
    name: string;
    is_admin: boolean;
    suspended_at: string | null;
    suspension_reason: string | null;
    created_at: string;
  };
  stripePayments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    stripe_payment_intent_id: string | null;
  }>;
  mpesaPayments: Array<{
    id: string;
    amount: number;
    phone_number: string;
    status: string;
    mpesa_receipt_number: string | null;
    created_at: string;
  }>;
  subscriptions: Array<{
    id: string;
    status: string;
    plan_name: string;
    plan_amount: number;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    created_at: string;
  }>;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string;
  status:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "paused";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
  plan: Plan;
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  // 1. Explicitly declare properties so they are purely type annotations
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    
    // 2. Assign the value manually inside the constructor body
    this.status = status;

    // Fixes the prototype chain inheritance for older JS runtimes
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}


// ─── Core request helper ──────────────────────────────────────────────────────

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

// ─── API — all methods in one object so TypeScript knows the full type ────────

export const api = {

  // ── Auth ──────────────────────────────────────────────────────────────────
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

  updateProfile(
    token: string,
    payload: {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    }
  ) {
    return request<{ user: User }>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
      token,
    });
  },

  // ── Stripe payments ───────────────────────────────────────────────────────
  createPaymentIntent(
    token: string,
    payload: {
      amount: number;
      currency: string;
      metadata?: Record<string, string>;
    }
  ) {
    return request<{ paymentIntent: StripePayment; clientSecret: string }>(
      "/payments",
      { method: "POST", body: JSON.stringify(payload), token }
    );
  },

  getStripePayments(token: string) {
    return request<StripePayment[]>("/payments", { token });
  },

  getStripePayment(token: string, id: string) {
    return request<StripePaymentWithTransactions>(`/payments/${id}`, { token });
  },

  refund(token: string, id: string, payload?: { amount?: number; reason?: string }) {
    return request<Transaction>(`/payments/${id}/refund`, {
      method: "POST",
      body: JSON.stringify(payload ?? {}),
      token,
    });
  },

  // ── M-Pesa payments ───────────────────────────────────────────────────────
  initiateMpesa(
    token: string,
    payload: {
      phone: string;
      amount: number;
      account_reference?: string;
      description?: string;
    }
  ) {
    return request<MpesaPayment>("/payments/mpesa", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  getMpesaPayments(token: string) {
    return request<MpesaPayment[]>("/payments/mpesa", { token });
  },

  getMpesaPayment(token: string, id: string) {
    return request<MpesaPayment>(`/payments/mpesa/${id}`, { token });
  },

  // ── Admin ─────────────────────────────────────────────────────────────────

getAdminStats(token: string) {
  return request<{
    totalRevenueCents: number;
    stripeRevenueCents: number;
    mpesaRevenueCents: number;
    totalUsers: number;
    adminUsers: number;
    activeSubscriptions: number;
    pastDueSubscriptions: number;
    failedPayments: number;
    planBreakdown: Array<{
      name: string;
      amount: number;
      currency: string;
      subscriber_count: number;
    }>;
  }>("/admin/stats", { token });
},

getAdminPayments(
  token: string,
  params?: {
    page?: number;
    search?: string;
    status?: string;
    method?: string;
  }
) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.method) query.set("method", params.method);
  const qs = query.toString();
  return request<{
    payments: AdminPayment[];
    total: number;
    page: number;
    limit: number;
  }>(`/admin/payments${qs ? `?${qs}` : ""}`, { token });
},

getAdminUsers(
  token: string,
  params?: { page?: number; search?: string }
) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return request<{
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
  }>(`/admin/users${qs ? `?${qs}` : ""}`, { token });
},

getAdminUserDetail(token: string, userId: string) {
  return request<AdminUserDetail>(`/admin/users/${userId}`, { token });
},

// ── Admin actions ─────────────────────────────────────────────────────────────────
adminRefund(
  token: string,
  paymentId: string,
  payload?: { amount?: number; reason?: string }
) {
  return request<{ id: string; amount: number; status: string }>(
    `/admin/payments/${paymentId}/refund`,
    { method: "POST", body: JSON.stringify(payload ?? {}), token }
  );
},

adminCancelSubscription(
  token: string,
  subscriptionId: string,
  payload?: { immediately?: boolean }
) {
  return request<{ id: string; status: string }>(
    `/admin/subscriptions/${subscriptionId}/cancel`,
    { method: "POST", body: JSON.stringify(payload ?? {}), token }
  );
},

adminSuspendUser(
  token: string,
  userId: string,
  payload: { reason: string }
) {
  return request<{
    id: string;
    email: string;
    suspended_at: string;
    suspension_reason: string;
  }>(`/admin/users/${userId}/suspend`, {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
},

adminUnsuspendUser(token: string, userId: string) {
  return request<{
    id: string;
    email: string;
    suspended_at: null;
    suspension_reason: null;
  }>(`/admin/users/${userId}/unsuspend`, {
    method: "POST",
    body: JSON.stringify({}),
    token,
  });
},

  // ── Subscriptions ─────────────────────────────────────────────────────────
  getPlans(token: string) {
    return request<Plan[]>("/subscriptions/plans", { token });
  },

  createSubscription(
    token: string,
    payload: { plan_id: string; payment_method_id: string }
  ) {
    return request<{ subscription: Subscription; clientSecret: string | null }>(
      "/subscriptions",
      { method: "POST", body: JSON.stringify(payload), token }
    );
  },

  getUserSubscriptions(token: string) {
    return request<Subscription[]>("/subscriptions", { token });
  },

  getSubscription(token: string, id: string) {
    return request<Subscription>(`/subscriptions/${id}`, { token });
  },

  cancelSubscription(
    token: string,
    id: string,
    payload: { immediately: boolean }
  ) {
    return request<Subscription>(`/subscriptions/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  changePlan(token: string, id: string, payload: { plan_id: string }) {
    return request<Subscription>(`/subscriptions/${id}/change-plan`, {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },
};