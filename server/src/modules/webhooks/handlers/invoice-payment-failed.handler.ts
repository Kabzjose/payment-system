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
//send user email when subscription payment fails
  const subscription = await subscriptionRepository
  .findByStripeSubscriptionId(stripeSubId);

if (subscription) {
  const user = await userRepository.findById(subscription.user_id);
  const subWithPlan = await subscriptionRepository.findById(subscription.id);

  if (user && subWithPlan) {
    await emailService.sendSubscriptionPaymentFailed(user.email, {
      name: user.name,
      planName: subWithPlan.plan.name,
      amount: subWithPlan.plan.amount,
      currency: subWithPlan.plan.currency,
    });
  }
}

  
}