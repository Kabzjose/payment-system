import Stripe from 'stripe';
import { subscriptionRepository } from '../../subscriptions/subscription.repository';
import { logger } from '../../../utils/logger';
import { emailService } from '../../../utils/email.service';
import { userRepository } from '../../users/user.repository';

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

  // send user email when payment fails
  const user = await userRepository.findById(stripeIntent.metadata.userId);
if (user) {
  await emailService.sendPaymentFailed(user.email, {
    name: user.name,
    amount: stripeIntent.amount,
    currency: stripeIntent.currency,
    failureReason: failureMessage,
  });
}
}