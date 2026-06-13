// Stripe amounts are always integers in the smallest currency unit (cents for USD).
// This converts 2000 -> "20.00" for display.
export function formatAmount(amountInCents: number, currency: string): string {
  const value = amountInCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoString));
}

// Maps backend status strings to display labels + a color token
// used by the StatusPill component.
export const STATUS_CONFIG: Record<
  string,
  { label: string; tone: "success" | "pending" | "failed" | "neutral" }
> = {
  succeeded: { label: "Succeeded", tone: "success" },
  processing: { label: "Processing", tone: "pending" },
  requires_payment_method: { label: "Awaiting payment", tone: "neutral" },
  requires_confirmation: { label: "Awaiting confirmation", tone: "pending" },
  requires_action: { label: "Action required", tone: "pending" },
  canceled: { label: "Canceled", tone: "failed" },
  failed: { label: "Failed", tone: "failed" },
  pending: { label: "Pending", tone: "pending" },
};

export function statusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, tone: "neutral" as const };
}

export function transactionLabel(type: string): string {
  switch (type) {
    case "charge":
      return "Charge";
    case "refund":
      return "Refund";
    case "partial_refund":
      return "Partial refund";
    default:
      return type;
  }
}