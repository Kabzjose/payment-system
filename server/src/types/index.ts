export type PaymentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'canceled'
  | 'failed';

export type PaymentMethodType = 'card' | 'mpesa';
export type TransactionType = 'charge' | 'refund' | 'partial_refund';
export type TransactionStatus = 'pending' | 'succeeded' | 'failed';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Customer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  default_currency: string;
  created_at: Date;
}

export interface PaymentIntent {
  id: string;
  user_id: string;
  customer_id: string;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethodType;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  stripe_charge_id: string | null;
  created_at: Date;
}

export interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  status: 'received' | 'processed' | 'failed' | 'ignored';
  payload: Record<string, unknown>;
  error: string | null;
  processed_at: Date | null;
  created_at: Date;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  stripe_product_id: string;
  stripe_price_id: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  interval_count: number;
  trial_period_days: number;
  active: boolean;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  status: SubscriptionStatus;
  current_period_start: Date | null;
  current_period_end: Date | null;
  cancel_at_period_end: boolean;
  canceled_at: Date | null;
  trial_start: Date | null;
  trial_end: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan;
}

//mpesa
export type MpesaPaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export interface MpesaPayment {
  id: string;
  user_id: string;
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc: string;
  checkout_request_id: string;
  merchant_request_id: string;
  status: MpesaPaymentStatus;
  mpesa_receipt_number: string | null;
  result_code: number | null;
  result_desc: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}