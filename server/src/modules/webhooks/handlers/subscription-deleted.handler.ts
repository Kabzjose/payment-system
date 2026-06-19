import Stripe from 'stripe';
import { subscriptionRepository } from '../../subscriptions/subscription.repository';
import { logger } from '../../../utils/logger';

export async function handleSubscriptionDeleted(
  event: Stripe.Event
): Promise<void> {
  const sub = event.data.object as unknown as Stripe.Subscription;

  await subscriptionRepository.update(sub.id, {
    status: 'canceled',
    canceled_at: new Date(),
    cancel_at_period_end: false,
  });

  logger.info({ stripeSubId: sub.id }, 'Subscription canceled');
}