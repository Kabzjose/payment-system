import Stripe from 'stripe';
import { subscriptionRepository } from '../../subscriptions/subscription.repository';
import { logger } from '../../../utils/logger';

export async function handleInvoicePaid(
  event: Stripe.Event
): Promise<void> {
  const invoice = event.data.object as unknown as Stripe.Invoice;

  // Only handle subscription invoices
  if (!invoice.subscription) return;

  const stripeSubId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription.id;

  // When an invoice is paid, the subscription is confirmed active
  await subscriptionRepository.update(stripeSubId, {
    status: 'active',
  });

  logger.info(
    { stripeSubId, amount: invoice.amount_paid, invoiceId: invoice.id },
    'Invoice paid — subscription active'
  );
}