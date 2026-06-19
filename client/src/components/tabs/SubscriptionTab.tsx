import { useState, useEffect,type FormEvent } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "../../lib/stripe";
import { useAuth } from "../../lib/auth";
import { useSubscription } from "../../hooks/useSubscription";
import {api,type Plan,type Subscription,ApiError,} from "../../lib/api";
import {
  formatStripeAmount,
  formatInterval,
  formatBillingDate,
  
} from "../../lib/format";
import { StatusPill } from "../Statuspill";

// ─── Pricing card ─────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  highlighted,
  onSelect,
}: {
  plan: Plan;
  highlighted: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`rounded-xl p-6 border flex flex-col gap-4 ${
        highlighted
          ? "bg-[#0E1116] border-[#2a2f3a]"
          : "bg-white border-[#E5E2DA]"
      }`}
    >
      <div>
        <h3
          className={`font-serif text-xl font-medium ${
            highlighted ? "text-[#F7F5F0]" : "text-[#0E1116]"
          }`}
        >
          {plan.name}
        </h3>
        {plan.description && (
          <p
            className={`text-[12px] mt-1 ${
              highlighted ? "text-[#8B8578]" : "text-[#8B8578]"
            }`}
          >
            {plan.description}
          </p>
        )}
      </div>

      <div>
        <span
          className={`font-serif text-3xl tabular-nums ${
            highlighted ? "text-[#F7F5F0]" : "text-[#0E1116]"
          }`}
        >
          {formatStripeAmount(plan.amount, plan.currency)}
        </span>
        <span className="font-mono text-[11px] text-[#8B8578] ml-1">
          / {plan.interval}
        </span>
      </div>

      {plan.trial_period_days > 0 && (
        <p className="text-[11px] font-mono text-[#2D6A4F]">
          {plan.trial_period_days}-day free trial
        </p>
      )}

      <button
        onClick={onSelect}
        className={`w-full py-2.5 rounded-md text-[14px] font-medium transition-colors ${
          highlighted
            ? "bg-[#2D6A4F] text-white hover:bg-[#245a41]"
            : "bg-[#0E1116] text-[#F7F5F0] hover:bg-[#1a1f28]"
        }`}
      >
        Subscribe
      </button>
    </div>
  );
}

// ─── Pricing page ─────────────────────────────────────────────────────────────

function PricingPage({ onSelectPlan }: { onSelectPlan: (plan: Plan) => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
      if (!token) {
    setError("Not authenticated");
    setLoading(false);
    return;
  }

    api
      .getPlans(token)
      .then(setPlans)
      .catch((err: unknown) =>
        setError(err instanceof ApiError ? err.message : "Failed to load plans")
      )
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-[13px] text-[#8B8578]">Loading plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-[13px] text-[#C9402E]">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-[#0E1116]">Choose a plan</h2>
        <p className="text-[13px] text-[#8B8578] mt-1">
          Cancel anytime. No hidden fees.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map((plan, i) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            highlighted={i === plans.length - 1} // highlight most expensive
            onSelect={() => onSelectPlan(plan)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Checkout modal ───────────────────────────────────────────────────────────

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

function CheckoutFormInner({
  plan,
  onSuccess,
  onClose,
}: {
  plan: Plan;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [cardReady, setCardReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !token || !cardReady) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setSubmitting(true);
    setError(null);

    try {
      // Step 1: create payment method from card details
      // Card details go directly to Stripe — never touch your server
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card,
      });

      if (pmError || !paymentMethod) {
        setError(pmError?.message ?? "Could not process card");
        return;
      }

      // Step 2: send payment method ID + plan ID to your backend
      const { clientSecret } = await api.createSubscription(
        token,
        {
          plan_id: plan.id,
          payment_method_id: paymentMethod.id,
        }
      );

      // Step 3: if backend returns a clientSecret, the first invoice
      // needs card confirmation (3D Secure or additional auth)
      if (clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          clientSecret
        );
        if (confirmError) {
          setError(confirmError.message ?? "Payment confirmation failed");
          return;
        }
      }

      // Success — subscription is active
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Subscription failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0E1116]/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#F7F5F0] rounded-t-xl sm:rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E2DA]">
          <div>
            <p className="font-mono text-[11px] text-[#8B8578] uppercase tracking-wide">
              Subscribe
            </p>
            <p className="font-serif text-lg text-[#0E1116] mt-0.5">
              {plan.name} —{" "}
              {formatStripeAmount(plan.amount, plan.currency)}/
              {plan.interval}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8B8578] hover:text-[#0E1116] text-xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[12px] font-mono text-[#6B665C] mb-1.5">
              Card details
            </label>
            <div className="px-3 py-3.5 rounded-md border border-[#D9D5CC] bg-white">
              <CardElement
                options={CARD_ELEMENT_OPTIONS}
                onReady={() => setCardReady(true)}
              />
            </div>
            {cardReady && (
              <p className="mt-1.5 text-[11px] font-mono text-[#8B8578]">
                Test: 4242 4242 4242 4242 · any future date · any CVC
              </p>
            )}
          </div>

          {error && (
            <div className="text-[13px] text-[#C9402E] bg-[#C9402E]/8 border border-[#C9402E]/20 rounded-md px-3 py-2.5">
              ✗ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || !cardReady || submitting}
            className="w-full py-2.5 rounded-md bg-[#0E1116] text-[#F7F5F0] text-[14px] font-medium hover:bg-[#1a1f28] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Processing..."
              : `Subscribe — ${formatStripeAmount(plan.amount, plan.currency)}/${plan.interval}`}
          </button>

          <p className="text-center text-[11px] font-mono text-[#8B8578]">
            Cancel anytime · Powered by Stripe
          </p>
        </form>
      </div>
    </div>
  );
}

function CheckoutModal(props: {
  plan: Plan;
  onSuccess: () => void;
  onClose: () => void;
}) {
  return (
    <Elements stripe={getStripe()}>
      <CheckoutFormInner {...props} />
    </Elements>
  );
}

// ─── Cancel modal ─────────────────────────────────────────────────────────────

function CancelModal({
  subscription,
  onCancel,
  onClose,
}: {
  subscription: Subscription;
  onCancel: (immediately: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel(immediately: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      await onCancel(immediately);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Cancellation failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0E1116]/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#F7F5F0] rounded-t-xl sm:rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-[#0E1116]">
            Cancel subscription?
          </h3>
          <button
            onClick={onClose}
            className="text-[#8B8578] hover:text-[#0E1116] text-xl"
          >
            &times;
          </button>
        </div>

        <p className="text-[13px] text-[#8B8578]">
          You're currently on the{" "}
          <strong className="text-[#0E1116]">{subscription.plan.name}</strong>.
          Choose how you'd like to cancel:
        </p>

        {/* Option A: cancel at period end */}
        <button
          onClick={() => handleCancel(false)}
          disabled={submitting}
          className="w-full text-left p-4 rounded-lg border border-[#E5E2DA] bg-white hover:border-[#0E1116] transition-colors disabled:opacity-50"
        >
          <div className="font-medium text-[13px] text-[#0E1116]">
            Cancel at end of billing period
          </div>
          <div className="text-[12px] text-[#8B8578] mt-0.5">
            Keep access until{" "}
            <strong>{formatBillingDate(subscription.current_period_end)}</strong>
            . No further charges.
          </div>
        </button>

        {/* Option B: cancel immediately */}
        <button
          onClick={() => handleCancel(true)}
          disabled={submitting}
          className="w-full text-left p-4 rounded-lg border border-[#C9402E]/30 bg-white hover:bg-[#C9402E]/5 transition-colors disabled:opacity-50"
        >
          <div className="font-medium text-[13px] text-[#C9402E]">
            Cancel immediately
          </div>
          <div className="text-[12px] text-[#8B8578] mt-0.5">
            Access ends now. No refund for unused time.
          </div>
        </button>

        {error && (
          <p className="text-[13px] text-[#C9402E]">✗ {error}</p>
        )}

        <button
          onClick={onClose}
          className="w-full text-[13px] text-[#8B8578] hover:text-[#0E1116] transition-colors"
        >
          Keep my subscription
        </button>
      </div>
    </div>
  );
}

// ─── Change plan modal ────────────────────────────────────────────────────────

function ChangePlanModal({
  currentSubscription,
  onChangePlan,
  onClose,
}: {
  currentSubscription: Subscription;
  onChangePlan: (planId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null); // planId being submitted
  const [error, setError] = useState<string | null>(null);
   const { token } = useAuth();

  useEffect(() => {
      if (!token) {
    setError("Not authenticated");
    setLoading(false);
    return;
  }

    api
      .getPlans(token)
      .then(setPlans)
      .catch(() => setError("Failed to load plans"))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelect(planId: string) {
    setSubmitting(planId);
    setError(null);
    try {
      await onChangePlan(planId);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Plan change failed");
      setSubmitting(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0E1116]/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-[#F7F5F0] rounded-t-xl sm:rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-[#0E1116]">Change plan</h3>
          <button
            onClick={onClose}
            className="text-[#8B8578] hover:text-[#0E1116] text-xl"
          >
            &times;
          </button>
        </div>

        <p className="text-[12px] font-mono text-[#8B8578]">
          Prorated credits applied automatically when switching plans.
        </p>

        {loading && (
          <p className="text-[13px] text-[#8B8578]">Loading plans...</p>
        )}

        {error && (
          <p className="text-[13px] text-[#C9402E]">✗ {error}</p>
        )}

        <div className="space-y-3">
          {plans.map((plan) => {
            const isCurrent =
              plan.id === currentSubscription.plan_id;
            const isSubmitting = submitting === plan.id;

            return (
              <div
                key={plan.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isCurrent
                    ? "border-[#2D6A4F]/30 bg-[#2D6A4F]/5"
                    : "border-[#E5E2DA] bg-white"
                }`}
              >
                <div>
                  <div className="font-medium text-[13px] text-[#0E1116]">
                    {plan.name}
                  </div>
                  <div className="font-mono text-[12px] text-[#8B8578]">
                    {formatStripeAmount(plan.amount, plan.currency)} /{" "}
                    {plan.interval}
                  </div>
                </div>

                {isCurrent ? (
                  <span className="text-[11px] font-mono text-[#2D6A4F] bg-[#2D6A4F]/10 px-2 py-1 rounded">
                    Current
                  </span>
                ) : (
                  <button
                    onClick={() => handleSelect(plan.id)}
                    disabled={!!submitting}
                    className="text-[13px] font-medium text-[#0E1116] border border-[#0E1116]/20 px-3 py-1.5 rounded-md hover:bg-[#0E1116] hover:text-[#F7F5F0] transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Switching..." : "Switch"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Active subscription card ─────────────────────────────────────────────────

function ActiveSubscriptionCard({
  subscription,
  onCanceled,
  onPlanChanged,
}: {
  subscription: Subscription;
  onCanceled: () => void;
  onPlanChanged: () => void;
}) {
  const { token } = useAuth();
  const [showCancel, setShowCancel] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  

  const isCanceling = subscription.cancel_at_period_end;
  const isActive = ["active", "trialing"].includes(subscription.status);

  async function handleCancel(immediately: boolean) {
    if (!token) return;
    await api.cancelSubscription(token, subscription.id, { immediately });
    setShowCancel(false);
    onCanceled();
  }

  async function handleChangePlan(planId: string) {
    if (!token) return;
    await api.changePlan(token, subscription.id, { plan_id: planId });
    setShowChangePlan(false);
    onPlanChanged();
  }

  return (
    <>
      <div>
        <div className="mb-6">
          <h2 className="font-serif text-2xl text-[#0E1116]">
            Your subscription
          </h2>
          <p className="text-[13px] text-[#8B8578] mt-1">
            Manage your plan and billing.
          </p>
        </div>

        {/* Subscription card */}
        <div className="rounded-xl border border-[#E5E2DA] bg-white overflow-hidden">
          {/* Plan header */}
          <div className="px-5 py-4 bg-[#0E1116] flex items-center justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-[#8B8578] uppercase mb-1">
                Current plan
              </p>
              <p className="font-serif text-xl text-[#F7F5F0]">
                {subscription.plan.name}
              </p>
            </div>
            <StatusPill status={subscription.status} />
          </div>

          {/* Details grid */}
          <div className="divide-y divide-[#E5E2DA]">
            <div className="flex justify-between items-center px-5 py-3">
              <span className="font-mono text-[12px] text-[#8B8578]">
                Price
              </span>
              <span className="font-serif text-[15px] text-[#0E1116] tabular-nums">
                {formatStripeAmount(
                  subscription.plan.amount,
                  subscription.plan.currency
                )}
                <span className="font-mono text-[11px] text-[#8B8578] ml-1">
                  / {subscription.plan.interval}
                </span>
              </span>
            </div>

            <div className="flex justify-between items-center px-5 py-3">
              <span className="font-mono text-[12px] text-[#8B8578]">
                Billing
              </span>
              <span className="font-mono text-[12px] text-[#0E1116]">
                {formatInterval(
                  subscription.plan.interval,
                  subscription.plan.interval_count
                )}
              </span>
            </div>

            {subscription.current_period_end && (
              <div className="flex justify-between items-center px-5 py-3">
                <span className="font-mono text-[12px] text-[#8B8578]">
                  {isCanceling ? "Access until" : "Next billing"}
                </span>
                <span className="font-mono text-[12px] text-[#0E1116]">
                  {formatBillingDate(subscription.current_period_end)}
                </span>
              </div>
            )}

            {subscription.status === "trialing" &&
              subscription.trial_end && (
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="font-mono text-[12px] text-[#8B8578]">
                    Trial ends
                  </span>
                  <span className="font-mono text-[12px] text-[#9C7A1F]">
                    {formatBillingDate(subscription.trial_end)}
                  </span>
                </div>
              )}
          </div>

          {/* Canceling banner */}
          {isCanceling && (
            <div className="px-5 py-3 bg-[#fffbeb] border-t border-[#fcd34d]/30">
              <p className="text-[12px] font-mono text-[#9C7A1F]">
                ⚠ Cancels on{" "}
                {formatBillingDate(subscription.current_period_end)} — you
                keep access until then.
              </p>
            </div>
          )}

          {/* Past due warning */}
          {subscription.status === "past_due" && (
            <div className="px-5 py-3 bg-[#fee2e2] border-t border-[#fca5a5]/30">
              <p className="text-[12px] font-mono text-[#C9402E]">
                ⚠ Payment failed. Stripe is retrying automatically. Please
                update your payment method if this persists.
              </p>
            </div>
          )}

          {/* Actions */}
          {isActive && !isCanceling && (
            <div className="px-5 py-4 border-t border-[#E5E2DA] flex gap-3">
              <button
                onClick={() => setShowChangePlan(true)}
                className="flex-1 py-2 rounded-md border border-[#E5E2DA] text-[13px] text-[#0E1116] hover:bg-[#F7F5F0] transition-colors"
              >
                Change plan
              </button>
              <button
                onClick={() => setShowCancel(true)}
                className="flex-1 py-2 rounded-md border border-[#C9402E]/30 text-[13px] text-[#C9402E] hover:bg-[#C9402E]/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {showCancel && (
        <CancelModal
          subscription={subscription}
          onCancel={handleCancel}
          onClose={() => setShowCancel(false)}
        />
      )}

      {showChangePlan && (
        <ChangePlanModal
          currentSubscription={subscription}
          onChangePlan={handleChangePlan}
          onClose={() => setShowChangePlan(false)}
        />
      )}
    </>
  );
}

// ─── SubscriptionTab — root component ────────────────────────────────────────
// This is what the Dashboard imports. It decides which screen to show
// based on whether the user has an active subscription.

export function SubscriptionTab() {
  const { subscription, loading, refresh } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-[13px] text-[#8B8578]">Loading...</p>
      </div>
    );
  }

  // Has an active/trialing/past_due subscription → show management UI
  if (
    subscription &&
    ["active", "trialing", "past_due"].includes(subscription.status)
  ) {
    return (
      <ActiveSubscriptionCard
        subscription={subscription}
        onCanceled={refresh}
        onPlanChanged={refresh}
      />
    );
  }

  // No active subscription → show pricing page
  return (
    <>
      <PricingPage onSelectPlan={setSelectedPlan} />

      {selectedPlan && (
        <CheckoutModal
          plan={selectedPlan}
          onSuccess={() => {
            setSelectedPlan(null);
            refresh(); // reload subscription state
          }}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </>
  );
}