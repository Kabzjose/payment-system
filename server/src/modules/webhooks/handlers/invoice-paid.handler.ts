import Stripe from 'stripe';
import { subscriptionRepository } from '../../subscriptions/subscription.repository';
import { logger } from '../../../utils/logger';
import { emailService } from '../../../utils/email.service';
import { userRepository } from '../../users/user.repository';


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

  //send user email when subscription is renewed
  const subscription = await subscriptionRepository
  .findByStripeSubscriptionId(stripeSubId);

if (subscription) {
  const user = await userRepository.findById(subscription.user_id);
  const subWithPlan = await subscriptionRepository.findById(subscription.id);

  if (user && subWithPlan) {
    await emailService.sendSubscriptionRenewed(user.email, {
      name: user.name,
      planName: subWithPlan.plan.name,
      amount: subWithPlan.plan.amount,
      currency: subWithPlan.plan.currency,
      nextBillingDate: subWithPlan.current_period_end?.toISOString()
        ?? new Date().toISOString(),
    });
  }
}
}