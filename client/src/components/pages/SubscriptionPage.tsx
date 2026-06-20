import { useState, useEffect, type FormEvent } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "../../lib/stripe";
import { useAuth } from "../../lib/auth";
import { useTheme } from "../../lib/theme";
import { useSubscription } from "../../hooks/useSubscription";
import { api, type Plan, type Subscription, ApiError } from "../../lib/api";
import { formatStripeAmount, formatInterval, formatBillingDate } from "../../lib/format";
import { StatusBadge } from "../ui/StatusBadge";
import { Modal, ModalHeader } from "../ui/Modal";
import { LoadingSkeleton } from "../ui/LoadingSkeleton";

function useCardOptions() {
  const { theme } = useTheme();
  return {
    style: {
      base: {
        fontSize: "15px",
        fontFamily: '"IBM Plex Mono", monospace',
        color: theme === "dark" ? "#F1F5F9" : "#0F172A",
        "::placeholder": { color: theme === "dark" ? "#475569" : "#94A3B8" },
        backgroundColor: "transparent",
      },
      invalid: { color: "#F87171" },
    },
  };
}

function PlanCard({ plan, highlighted, onSelect }: { plan: Plan; highlighted: boolean; onSelect: () => void }) {
  return (
    <div className="rounded-xl p-6 flex flex-col gap-5 transition-all duration-200 hover:translate-y-[-2px]"
      style={highlighted
        ? { background: "var(--accent-muted)", border: "1px solid rgba(99,102,241,0.4)", boxShadow: "0 0 30px rgba(99,102,241,0.1)" }
        : { background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
      {highlighted && (
        <span className="self-start text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: "rgba(99,102,241,0.2)", color: "#818CF8" }}>Popular</span>
      )}
      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{plan.name}</h3>
        {plan.description && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{plan.description}</p>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{formatStripeAmount(plan.amount, plan.currency)}</span>
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>/ {plan.interval}</span>
      </div>
      {plan.trial_period_days > 0 && (
        <p className="text-xs font-mono" style={{ color: "#34D399" }}>✓ {plan.trial_period_days}-day free trial</p>
      )}
      <button onClick={onSelect} className={highlighted ? "btn-primary" : "btn-secondary w-full"}>Get started</button>
    </div>
  );
}

function PricingPage({ onSelectPlan }: { onSelectPlan: (plan: Plan) => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) { setError("Not authenticated"); setLoading(false); return; }
    api.getPlans(token).then(setPlans)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load plans"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <LoadingSkeleton variant="cards" />;
  if (error) return <p className="text-sm text-center py-12" style={{ color: "#F87171" }}>{error}</p>;

  return (
    <div>
      <div className="mb-8 text-center">
        <h3 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Choose your plan</h3>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Cancel anytime. No hidden fees.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-3xl mx-auto">
        {plans.map((plan, i) => (
          <PlanCard key={plan.id} plan={plan} highlighted={i === plans.length - 1} onSelect={() => onSelectPlan(plan)} />
        ))}
      </div>
    </div>
  );
}

function CheckoutFormInner({ plan, onSuccess, onClose }: { plan: Plan; onSuccess: () => void; onClose: () => void }) {
  const { token } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const cardOptions = useCardOptions();
  const [cardReady, setCardReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || !token || !cardReady) return;
    const card = elements.getElement(CardElement);
    if (!card) return;
    setSubmitting(true); setError(null);
    try {
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({ type: "card", card });
      if (pmError || !paymentMethod) { setError(pmError?.message ?? "Could not process card"); return; }
      const { clientSecret } = await api.createSubscription(token, { plan_id: plan.id, payment_method_id: paymentMethod.id });
      if (clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);
        if (confirmError) { setError(confirmError.message ?? "Payment confirmation failed"); return; }
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Subscription failed");
    } finally { setSubmitting(false); }
  }

  return (
    <Modal onClose={onClose}>
      <ModalHeader title={`Subscribe to ${plan.name}`} subtitle={`${formatStripeAmount(plan.amount, plan.currency)} / ${plan.interval}`} onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Card Details</label>
          <div className="stripe-element-container">
            <CardElement options={cardOptions} onReady={() => setCardReady(true)} />
          </div>
          {cardReady && <p className="mt-1.5 text-[11px] font-mono" style={{ color: "var(--text-label)" }}>Test: 4242 4242 4242 4242 · any date · any CVC</p>}
        </div>
        {error && (
          <div className="flex gap-2 text-sm rounded-lg px-4 py-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>
            <span>✗</span><span>{error}</span>
          </div>
        )}
        <button type="submit" disabled={!stripe || !cardReady || submitting} className="btn-primary w-full py-3">
          {submitting ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</span>
            : `Subscribe — ${formatStripeAmount(plan.amount, plan.currency)}/${plan.interval}`}
        </button>
        <p className="text-center text-[11px] font-mono" style={{ color: "var(--text-label)" }}>Cancel anytime · Powered by Stripe</p>
      </form>
    </Modal>
  );
}

function CheckoutModal(props: { plan: Plan; onSuccess: () => void; onClose: () => void }) {
  return <Elements stripe={getStripe()}><CheckoutFormInner {...props} /></Elements>;
}

function CancelModal({ subscription, onCancel, onClose }: { subscription: Subscription; onCancel: (immediately: boolean) => Promise<void>; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel(immediately: boolean) {
    setSubmitting(true); setError(null);
    try { await onCancel(immediately); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Cancellation failed"); setSubmitting(false); }
  }

  return (
    <Modal onClose={onClose} maxWidth="sm">
      <ModalHeader title="Cancel subscription?" onClose={onClose} />
      <div className="p-5 space-y-3">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          You're on <strong style={{ color: "var(--text-primary)" }}>{subscription.plan.name}</strong>. Choose how to cancel:
        </p>
        <button onClick={() => handleCancel(false)} disabled={submitting}
          className="w-full text-left p-4 rounded-xl transition-colors"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Cancel at period end</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Access until <strong>{formatBillingDate(subscription.current_period_end)}</strong>. No charges.</p>
        </button>
        <button onClick={() => handleCancel(true)} disabled={submitting}
          className="w-full text-left p-4 rounded-xl transition-colors"
          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.05)")}>
          <p className="text-sm font-semibold" style={{ color: "#F87171" }}>Cancel immediately</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Access ends now. No refund for unused time.</p>
        </button>
        {error && <p className="text-xs" style={{ color: "#F87171" }}>✗ {error}</p>}
        <button onClick={onClose} className="btn-ghost w-full text-xs justify-center">Keep my subscription</button>
      </div>
    </Modal>
  );
}

function ChangePlanModal({ currentSubscription, onChangePlan, onClose }: { currentSubscription: Subscription; onChangePlan: (planId: string) => Promise<void>; onClose: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) { setError("Not authenticated"); setLoading(false); return; }
    api.getPlans(token).then(setPlans).catch(() => setError("Failed to load plans")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelect(planId: string) {
    setSubmitting(planId); setError(null);
    try { await onChangePlan(planId); }
    catch (err: unknown) { setError(err instanceof ApiError ? err.message : "Plan change failed"); setSubmitting(null); }
  }

  return (
    <Modal onClose={onClose} maxWidth="sm">
      <ModalHeader title="Change plan" subtitle="Prorated credits applied automatically" onClose={onClose} />
      <div className="p-5 space-y-3">
        {loading && <LoadingSkeleton variant="detail" />}
        {error && <p className="text-xs" style={{ color: "#F87171" }}>✗ {error}</p>}
        {plans.map((plan) => {
          const isCurrent = plan.id === currentSubscription.plan_id;
          const isLoading = submitting === plan.id;
          return (
            <div key={plan.id} className="flex items-center justify-between p-4 rounded-xl"
              style={isCurrent
                ? { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }
                : { background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{plan.name}</p>
                <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>{formatStripeAmount(plan.amount, plan.currency)} / {plan.interval}</p>
              </div>
              {isCurrent ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#34D399" }}>Current</span>
              ) : (
                <button onClick={() => handleSelect(plan.id)} disabled={!!submitting} className="btn-secondary text-xs px-3 py-1.5">
                  {isLoading ? "Switching..." : "Switch"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function ActiveSubscriptionCard({ subscription, onCanceled, onPlanChanged }: { subscription: Subscription; onCanceled: () => void; onPlanChanged: () => void }) {
  const { token } = useAuth();
  const [showCancel, setShowCancel] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const isCanceling = subscription.cancel_at_period_end;
  const isActive = ["active", "trialing"].includes(subscription.status);

  async function handleCancel(immediately: boolean) {
    if (!token) return;
    await api.cancelSubscription(token, subscription.id, { immediately });
    setShowCancel(false); onCanceled();
  }

  async function handleChangePlan(planId: string) {
    if (!token) return;
    await api.changePlan(token, subscription.id, { plan_id: planId });
    setShowChangePlan(false); onPlanChanged();
  }

  const rows = [
    { label: "Price", value: `${formatStripeAmount(subscription.plan.amount, subscription.plan.currency)} / ${subscription.plan.interval}` },
    { label: "Billing", value: formatInterval(subscription.plan.interval, subscription.plan.interval_count) },
    ...(subscription.current_period_end ? [{ label: isCanceling ? "Access until" : "Next billing", value: formatBillingDate(subscription.current_period_end) }] : []),
    ...(subscription.status === "trialing" && subscription.trial_end ? [{ label: "Trial ends", value: formatBillingDate(subscription.trial_end) }] : []),
  ];

  return (
    <>
      <div className="max-w-xl">
        <div className="mb-6">
          <h3 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Your subscription</h3>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage your plan and billing.</p>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ background: "var(--accent-muted)", borderBottom: "1px solid var(--border)" }}>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>Current plan</p>
              <p className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{subscription.plan.name}</p>
            </div>
            <StatusBadge status={subscription.status} />
          </div>
          <div style={{ background: "var(--bg-surface)" }}>
            {rows.map((row, i) => (
              <div key={i} className="flex justify-between items-center px-5 py-3.5"
                style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}>
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{row.value}</span>
              </div>
            ))}
          </div>
          {isCanceling && (
            <div className="px-5 py-3" style={{ background: "rgba(245,158,11,0.08)", borderTop: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs font-mono" style={{ color: "#FCD34D" }}>⚠ Cancels on {formatBillingDate(subscription.current_period_end)} — you keep access until then.</p>
            </div>
          )}
          {subscription.status === "past_due" && (
            <div className="px-5 py-3" style={{ background: "rgba(239,68,68,0.08)", borderTop: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-xs font-mono" style={{ color: "#F87171" }}>⚠ Payment failed. Stripe is retrying. Update your payment method if this persists.</p>
            </div>
          )}
          {isActive && !isCanceling && (
            <div className="flex gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
              <button onClick={() => setShowChangePlan(true)} className="btn-secondary flex-1 text-sm">Change plan</button>
              <button onClick={() => setShowCancel(true)} className="btn-danger flex-1 text-sm">Cancel</button>
            </div>
          )}
        </div>
      </div>
      {showCancel && <CancelModal subscription={subscription} onCancel={handleCancel} onClose={() => setShowCancel(false)} />}
      {showChangePlan && <ChangePlanModal currentSubscription={subscription} onChangePlan={handleChangePlan} onClose={() => setShowChangePlan(false)} />}
    </>
  );
}

export function SubscriptionPage() {
  const { subscription, loading, refresh } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  return (
    <div className="max-w-5xl mx-auto fade-in">
      <div className="mb-8">
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Subscriptions</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage your plan and billing</p>
      </div>
      {loading ? <LoadingSkeleton variant="detail" /> :
        subscription && ["active", "trialing", "past_due"].includes(subscription.status) ? (
          <ActiveSubscriptionCard subscription={subscription} onCanceled={refresh} onPlanChanged={refresh} />
        ) : (
          <>
            <PricingPage onSelectPlan={setSelectedPlan} />
            {selectedPlan && (
              <CheckoutModal plan={selectedPlan} onSuccess={() => { setSelectedPlan(null); refresh(); }} onClose={() => setSelectedPlan(null)} />
            )}
          </>
        )}
    </div>
  );
}
