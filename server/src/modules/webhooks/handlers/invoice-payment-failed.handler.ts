import Stripe from 'stripe';
import { subscriptionRepository } from '../../subscriptions/subscription.repository';
import { logger } from '../../../utils/logger';

export async function handleInvoicePaymentFailed(
  event: Stripe.Event
): Promise<void> {
  const invoice = event.data.object as unknown as Stripe.Invoice;

  if (!invoice.subscription) return;

  const stripeSubId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription.id;

  // Mark subscription as past_due — Stripe will retry automatically
  await subscriptionRepository.update(stripeSubId, {
    status: 'past_due',
  });

  logger.warn(
    { stripeSubId, invoiceId: invoice.id },
    'Invoice payment failed — subscription past_due'
  );

  // In production you'd also send the user an email here:
  // "Your payment failed — please update your card"
}