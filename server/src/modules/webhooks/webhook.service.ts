import Stripe from 'stripe';
import { stripe } from '../../config/stripe';
import { env } from '../../config/env';
import { webhookRepository } from './webhook.repository';
import { handlePaymentIntentSucceeded } from './handlers/payment-intent-succeeded.handler';
import { handlePaymentIntentFailed } from './handlers/payment-intent-failed.handler';
import { handleChargeRefunded } from './handlers/charge-refunded.handler';
import { handleSubscriptionUpdated } from './handlers/subscription-updated.handler';
import { handleSubscriptionDeleted } from './handlers/subscription-deleted.handler';
import { handleInvoicePaid } from './handlers/invoice-paid.handler';
import { handleInvoicePaymentFailed } from './handlers/invoice-payment-failed.handler';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

// Events we care about — ignore everything else
const HANDLED_EVENTS = new Set([
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'charge.refunded',
   'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
]);

export const webhookService = {

  async processEvent(rawBody: Buffer, signature: string): Promise<void> {

    // ── Step 1: Verify signature ──────────────────────────────────────
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      throw new AppError('Invalid webhook signature', 400);
    }

    logger.info({ eventId: event.id, type: event.type }, 'Webhook received');

    // ── Step 2: Idempotency check ─────────────────────────────────────
    const existing = await webhookRepository.findByStripeEventId(event.id);
    if (existing) {
      logger.info({ eventId: event.id }, 'Duplicate webhook — skipping');
      return; // Already processed, return silently
    }

    // ── Step 3: Store the event ───────────────────────────────────────
    const webhookEvent = await webhookRepository.create({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });

    // ── Step 4: Ignore unhandled event types ──────────────────────────
    if (!HANDLED_EVENTS.has(event.type)) {
      await webhookRepository.markIgnored(webhookEvent.id);
      logger.info({ type: event.type }, 'Webhook ignored — not handled');
      return;
    }

    // ── Step 5: Route to correct handler ─────────────────────────────
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(
            event as Stripe.PaymentIntentSucceededEvent
          );
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(
            event as Stripe.PaymentIntentPaymentFailedEvent
          );
          break;

        case 'charge.refunded':
          await handleChargeRefunded(event as Stripe.ChargeRefundedEvent);
          break;
          case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event);
          break;

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event);
          break;

        case 'invoice.paid':
          await handleInvoicePaid(event);
          break;

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event);
          break;
      }

      // ── Step 6: Mark processed ────────────────────────────────────
      await webhookRepository.markProcessed(webhookEvent.id);

    } catch (err) {
      // Mark failed but don't rethrow — we already returned 200 to Stripe
      // The event is stored so we can replay it manually if needed
      const message = err instanceof Error ? err.message : 'Unknown error';
      await webhookRepository.markFailed(webhookEvent.id, message);
      logger.error({ eventId: event.id, err }, 'Webhook handler failed');
    }
  },

};