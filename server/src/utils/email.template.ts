import { formatStripeAmount, formatMpesaAmount, formatDate } from './format';

// ─── Base layout ──────────────────────────────────────────────────────────────
// Every email uses this wrapper — consistent header, footer, and styling
function baseLayout(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0efeb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0efeb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#8B8578;font-family:monospace;">
                Ledger
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #E5E2DA;padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#8B8578;font-family:monospace;">
                You're receiving this because you have an account with Ledger.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─── Helper components ────────────────────────────────────────────────────────

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:500;color:#0E1116;font-family:Georgia,serif;">${text}</h1>`;
}

function subheading(text: string): string {
  return `<p style="margin:0 0 24px 0;font-size:14px;color:#8B8578;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #E5E2DA;margin:24px 0;"/>`;
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0;font-size:12px;font-family:monospace;color:#8B8578;">${label}</td>
      <td style="padding:8px 0;font-size:13px;color:#0E1116;text-align:right;">${value}</td>
    </tr>
  `;
}

function table(rows: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${rows}
    </table>
  `;
}

function pill(text: string, color: 'green' | 'red' | 'amber'): string {
  const colors = {
    green: 'background:#dcfce7;color:#2D6A4F;border:1px solid #86efac;',
    red:   'background:#fee2e2;color:#C9402E;border:1px solid #fca5a5;',
    amber: 'background:#fffbeb;color:#9C7A1F;border:1px solid #fcd34d;',
  };
  return `<span style="${colors[color]}padding:3px 10px;border-radius:20px;font-size:11px;font-family:monospace;">${text}</span>`;
}

function button(text: string, href: string): string {
  return `
    <a href="${href}"
       style="display:inline-block;background:#0E1116;color:#F7F5F0;padding:12px 24px;
              border-radius:6px;text-decoration:none;font-size:14px;margin-top:24px;">
      ${text}
    </a>
  `;
}

// ─── Email templates ──────────────────────────────────────────────────────────

export const emailTemplates = {

  // 1. Welcome email on register
  welcome(data: { name: string }) {
    const content = `
      ${heading(`Welcome, ${data.name}`)}
      ${subheading('Your account is ready.')}
      <p style="font-size:14px;color:#6B665C;line-height:1.6;margin:0 0 16px 0;">
        You can now make payments using your card or M-Pesa, and manage
        your subscription — all from your dashboard.
      </p>
    `;
    return {
      subject: `Welcome to Ledger`,
      html: baseLayout(content, 'Welcome'),
    };
  },

  // 2. Card payment receipt
  paymentSucceeded(data: {
    name: string;
    amount: number;
    currency: string;
    paymentId: string;
    createdAt: string;
  }) {
    const content = `
      ${heading('Payment confirmed')}
      ${subheading('Your card payment was successful.')}
      <p style="font-size:36px;font-family:Georgia,serif;color:#0E1116;margin:0 0 24px 0;font-weight:400;">
        ${formatStripeAmount(data.amount, data.currency)}
      </p>
      ${divider()}
      ${table(`
        ${row('Status', pill('Succeeded', 'green'))}
        ${row('Payment ID', data.paymentId)}
        ${row('Date', formatDate(data.createdAt))}
        ${row('Method', 'Card')}
      `)}
    `;
    return {
      subject: `Payment confirmed — ${formatStripeAmount(data.amount, data.currency)}`,
      html: baseLayout(content, 'Payment Confirmed'),
    };
  },

  // 3. Card payment failed
  paymentFailed(data: {
    name: string;
    amount: number;
    currency: string;
    failureReason: string;
  }) {
    const content = `
      ${heading('Payment failed')}
      ${subheading(`We couldn't process your payment of ${formatStripeAmount(data.amount, data.currency)}.`)}
      <p style="font-size:14px;color:#6B665C;line-height:1.6;margin:0 0 16px 0;">
        Reason: <strong>${data.failureReason}</strong>
      </p>
      <p style="font-size:14px;color:#6B665C;line-height:1.6;margin:0;">
        Please check your card details and try again. If the problem
        persists, contact your bank or try a different card.
      </p>
    `;
    return {
      subject: `Payment failed — ${formatStripeAmount(data.amount, data.currency)}`,
      html: baseLayout(content, 'Payment Failed'),
    };
  },

  // 4. Refund issued
  refundIssued(data: {
    name: string;
    amount: number;
    currency: string;
    originalAmount: number;
    refundId: string;
    createdAt: string;
  }) {
    const isPartial = data.amount < data.originalAmount;
    const content = `
      ${heading(`${isPartial ? 'Partial refund' : 'Refund'} issued`)}
      ${subheading('Your refund is on its way.')}
      <p style="font-size:36px;font-family:Georgia,serif;color:#0E1116;margin:0 0 24px 0;font-weight:400;">
        ${formatStripeAmount(data.amount, data.currency)}
      </p>
      ${divider()}
      ${table(`
        ${row('Refund amount', formatStripeAmount(data.amount, data.currency))}
        ${isPartial ? row('Original payment', formatStripeAmount(data.originalAmount, data.currency)) : ''}
        ${row('Reference', data.refundId)}
        ${row('Date', formatDate(data.createdAt))}
      `)}
      <p style="font-size:13px;color:#8B8578;margin:24px 0 0 0;font-family:monospace;">
        Refunds typically appear in 5–10 business days depending on your bank.
      </p>
    `;
    return {
      subject: `Refund of ${formatStripeAmount(data.amount, data.currency)} issued`,
      html: baseLayout(content, 'Refund Issued'),
    };
  },

  // 5. M-Pesa payment receipt
  mpesaPaymentSucceeded(data: {
    name: string;
    amount: number;
    phoneNumber: string;
    receiptNumber: string;
    createdAt: string;
  }) {
    const content = `
      ${heading('M-Pesa payment confirmed')}
      ${subheading('Your payment was received successfully.')}
      <p style="font-size:36px;font-family:Georgia,serif;color:#0E1116;margin:0 0 24px 0;font-weight:400;">
        ${formatMpesaAmount(data.amount)}
      </p>
      ${divider()}
      ${table(`
        ${row('Status', pill('Succeeded', 'green'))}
        ${row('M-Pesa receipt', `<strong style="font-family:monospace;">${data.receiptNumber}</strong>`)}
        ${row('Phone', data.phoneNumber)}
        ${row('Date', formatDate(data.createdAt))}
      `)}
      <p style="font-size:12px;color:#8B8578;margin:20px 0 0 0;font-family:monospace;">
        Keep your M-Pesa receipt number as proof of payment.
      </p>
    `;
    return {
      subject: `M-Pesa payment confirmed — ${formatMpesaAmount(data.amount)}`,
      html: baseLayout(content, 'M-Pesa Payment Confirmed'),
    };
  },

  // 6. Subscription started
  subscriptionStarted(data: {
    name: string;
    planName: string;
    amount: number;
    currency: string;
    interval: string;
    nextBillingDate: string;
  }) {
    const content = `
      ${heading(`You're subscribed to ${data.planName}`)}
      ${subheading('Your subscription is now active.')}
      ${divider()}
      ${table(`
        ${row('Plan', data.planName)}
        ${row('Amount', `${formatStripeAmount(data.amount, data.currency)} / ${data.interval}`)}
        ${row('Status', pill('Active', 'green'))}
        ${row('Next billing date', formatDate(data.nextBillingDate))}
      `)}
      <p style="font-size:13px;color:#8B8578;margin:20px 0 0 0;">
        You can manage or cancel your subscription at any time from your dashboard.
      </p>
    `;
    return {
      subject: `Subscription started — ${data.planName}`,
      html: baseLayout(content, 'Subscription Started'),
    };
  },

  // 7. Subscription renewed (invoice paid)
  subscriptionRenewed(data: {
    name: string;
    planName: string;
    amount: number;
    currency: string;
    nextBillingDate: string;
  }) {
    const content = `
      ${heading('Subscription renewed')}
      ${subheading(`Your ${data.planName} subscription has been renewed.`)}
      <p style="font-size:36px;font-family:Georgia,serif;color:#0E1116;margin:0 0 24px 0;font-weight:400;">
        ${formatStripeAmount(data.amount, data.currency)}
      </p>
      ${divider()}
      ${table(`
        ${row('Plan', data.planName)}
        ${row('Status', pill('Active', 'green'))}
        ${row('Next billing date', formatDate(data.nextBillingDate))}
      `)}
    `;
    return {
      subject: `Subscription renewed — ${formatStripeAmount(data.amount, data.currency)}`,
      html: baseLayout(content, 'Subscription Renewed'),
    };
  },

  // 8. Subscription payment failed
  subscriptionPaymentFailed(data: {
    name: string;
    planName: string;
    amount: number;
    currency: string;
  }) {
    const content = `
      ${heading('Subscription payment failed')}
      ${subheading(`We couldn't renew your ${data.planName} subscription.`)}
      <p style="font-size:14px;color:#6B665C;line-height:1.6;margin:0 0 16px 0;">
        Your payment of <strong>${formatStripeAmount(data.amount, data.currency)}</strong> failed.
        Stripe will automatically retry in the next few days.
      </p>
      <p style="font-size:14px;color:#6B665C;line-height:1.6;margin:0;">
        To avoid losing access, please update your payment method in
        your dashboard before the next retry.
      </p>
      ${divider()}
      <p style="font-size:13px;color:#C9402E;font-family:monospace;margin:0;">
        Your subscription is currently past due. Access continues during the retry period.
      </p>
    `;
    return {
      subject: `Action required — subscription payment failed`,
      html: baseLayout(content, 'Subscription Payment Failed'),
    };
  },

  // 9. Subscription canceled
  subscriptionCanceled(data: {
    name: string;
    planName: string;
    accessUntil: string | null;
    immediately: boolean;
  }) {
    const content = `
      ${heading('Subscription canceled')}
      ${subheading(`Your ${data.planName} subscription has been canceled.`)}
      ${data.immediately
        ? `<p style="font-size:14px;color:#6B665C;line-height:1.6;margin:0;">
             Your subscription has been canceled and access has ended immediately.
             No further charges will be made.
           </p>`
        : `<p style="font-size:14px;color:#6B665C;line-height:1.6;margin:0;">
             You still have access until <strong>${data.accessUntil ? formatDate(data.accessUntil) : 'the end of your billing period'}</strong>.
             No further charges will be made after that date.
           </p>`
      }
    `;
    return {
      subject: `Subscription canceled — ${data.planName}`,
      html: baseLayout(content, 'Subscription Canceled'),
    };
  },

  // 10. Account suspended
  accountSuspended(data: {
    name: string;
    reason: string;
  }) {
    const content = `
      ${heading('Account suspended')}
      ${subheading('Your account has been temporarily suspended.')}
      <p style="font-size:14px;color:#6B665C;line-height:1.6;margin:0 0 16px 0;">
        Reason: <strong>${data.reason}</strong>
      </p>
      <p style="font-size:14px;color:#6B665C;line-height:1.6;margin:0;">
        If you believe this is a mistake, please reply to this email
        or contact our support team.
      </p>
    `;
    return {
      subject: 'Your account has been suspended',
      html: baseLayout(content, 'Account Suspended'),
    };
  },

};