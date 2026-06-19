import Stripe from 'stripe';
import { subscriptionRepository } from '../../subscriptions/subscription.repository';
import { planRepository } from '../../subscriptions/plan.repository';
import { logger } from '../../../utils/logger';

export async function handleSubscriptionUpdated(
  event: Stripe.Event
): Promise<void> {
  const sub = event.data.object as unknown as Stripe.Subscription;

  logger.info(
    { stripeSubId: sub.id, status: sub.status },
    'Subscription updated'
  );

  // Find the matching plan in our DB by the price ID
  const priceId = sub.items.data[0]?.price.id;
  const plan = priceId
    ? await planRepository.findByStripePriceId(priceId)
    : null;

            const existing =
        await subscriptionRepository.findByStripeSubscriptionId(sub.id);

        if (!existing) {
        logger.warn(
            { stripeSubId: sub.id },
            'Subscription not found locally'
        );
        return;
        }

  await subscriptionRepository.update(sub.id, {
    status: sub.status,
    plan_id: plan?.id,
    stripe_price_id: priceId,
    current_period_start: new Date(sub.current_period_start * 1000),
    current_period_end: new Date(sub.current_period_end * 1000),
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: sub.canceled_at
      ? new Date(sub.canceled_at * 1000)
      : undefined,
    trial_start: sub.trial_start
      ? new Date(sub.trial_start * 1000)
      : undefined,
    trial_end: sub.trial_end
      ? new Date(sub.trial_end * 1000)
      : undefined,
  });
}