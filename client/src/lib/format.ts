// ─── Money ────────────────────────────────────────────────────────────────────

// Stripe: amounts in cents (2000 = $20.00)
export function formatStripeAmount(amountInCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

// M-Pesa: amounts in whole KES shillings (no cents)
export function formatMpesaAmount(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Dates ────────────────────────────────────────────────────────────────────

export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoString));
}

export function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ─── Status config ────────────────────────────────────────────────────────────
// Maps raw status strings (from both Stripe and M-Pesa)
// to display labels and color tones.

export type StatusTone = "success" | "pending" | "failed" | "neutral";

const STATUS_MAP: Record<string, { label: string; tone: StatusTone }> = {
  // Stripe statuses
  succeeded:                  { label: "Succeeded",         tone: "success"  },
  processing:                 { label: "Processing",        tone: "pending"  },
  requires_payment_method:    { label: "Awaiting payment",  tone: "neutral"  },
  requires_confirmation:      { label: "Confirming",        tone: "pending"  },
  requires_action:            { label: "Action required",   tone: "pending"  },
  canceled:                   { label: "Canceled",          tone: "failed"   },
  failed:                     { label: "Failed",            tone: "failed"   },
  // M-Pesa statuses
  pending:                    { label: "Pending",           tone: "neutral"  },
  cancelled:                  { label: "Cancelled",         tone: "failed"   },
};

export function statusConfig(status: string): { label: string; tone: StatusTone } {
  return STATUS_MAP[status] ?? { label: status, tone: "neutral" };
}

// ─── Transaction labels ───────────────────────────────────────────────────────

export function transactionLabel(type: string): string {
  const map: Record<string, string> = {
    charge:          "Charge",
    refund:          "Full refund",
    partial_refund:  "Partial refund",
  };
  return map[type] ?? type;
}

// ─── Phone number display ─────────────────────────────────────────────────────
// Converts 254712345678 → +254 712 345 678 for readable display

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return phone;
}

// ─── M-Pesa result codes ──────────────────────────────────────────────────────

export function mpesaResultLabel(code: number | null): string {
  if (code === null) return "—";
  const map: Record<number, string> = {
    0:    "Success",
    1:    "Insufficient funds",
    1032: "Cancelled by user",
    1037: "Timeout — no response",
    2001: "Wrong PIN",
  };
  return map[code] ?? `Error code ${code}`;
}
// ─── Subscription formatters ──────────────────────────────────────────────────

// Formats billing interval: "month" + 1 → "Monthly", "year" + 1 → "Yearly"
// "month" + 3 → "Every 3 months"
export function formatInterval(interval: string, intervalCount: number): string {
  if (intervalCount === 1) {
    return interval === "month" ? "Monthly" : "Yearly";
  }
  return `Every ${intervalCount} ${interval}s`;
}

// Formats a subscription period end date as a billing date
// e.g. "Aug 19, 2026"
export function formatBillingDate(isoString: string | null): string {
  if (!isoString) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(isoString)
  );
}

// Maps subscription status to display config
// Reuses the same StatusTone type from payment statuses
const SUBSCRIPTION_STATUS_MAP: Record<string, { label: string; tone: StatusTone }> = {
  active:             { label: "Active",          tone: "success" },
  trialing:           { label: "Trial",           tone: "pending" },
  past_due:           { label: "Past due",        tone: "failed"  },
  unpaid:             { label: "Unpaid",          tone: "failed"  },
  canceled:           { label: "Canceled",        tone: "neutral" },
  incomplete:         { label: "Incomplete",      tone: "neutral" },
  incomplete_expired: { label: "Expired",         tone: "failed"  },
  paused:             { label: "Paused",          tone: "neutral" },
};

export function subscriptionStatusConfig(
  status: string
): { label: string; tone: StatusTone } {
  return SUBSCRIPTION_STATUS_MAP[status] ?? { label: status, tone: "neutral" };
}