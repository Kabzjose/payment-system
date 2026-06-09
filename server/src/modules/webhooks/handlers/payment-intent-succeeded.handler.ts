import Stripe from 'stripe';
import { db } from '../../../config/db';
import { paymentRepository } from '../../payments/payment.repository';
import { logger } from '../../../utils/logger';

export async function handlePaymentIntentSucceeded(
  event: Stripe.PaymentIntentSucceededEvent
): Promise<void> {
  const stripeIntent = event.data.object;

  // Get our local payment intent ID from Stripe's metadata
  // We stored this in Phase 4 when creating the intent
  const localId = stripeIntent.metadata?.localPaymentIntentId;
  if (!localId) {
    logger.warn({ stripeId: stripeIntent.id }, 'No localPaymentIntentId in metadata');
    return;
  }

  // Use a DB transaction — both updates must succeed or neither does
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Update our payment intent status
    await client.query(
      `UPDATE payment_intents
       SET status = 'succeeded', updated_at = NOW()
       WHERE id = $1`,
      [localId]
    );

    // 2. Record the charge as a transaction
    // stripeIntent.latest_charge contains the charge ID
    const chargeId = typeof stripeIntent.latest_charge === 'string'
      ? stripeIntent.latest_charge
      : stripeIntent.latest_charge?.id;

    await client.query(
      `INSERT INTO transactions
         (payment_intent_id, amount, currency, type, status, stripe_charge_id)
       VALUES ($1, $2, $3, 'charge', 'succeeded', $4)
       ON CONFLICT (stripe_charge_id) DO NOTHING`,
      [localId, stripeIntent.amount, stripeIntent.currency, chargeId]
    );

    await client.query('COMMIT');

    logger.info(
      { localId, stripeId: stripeIntent.id, amount: stripeIntent.amount },
      'PaymentIntent succeeded'
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release(); // always return connection to pool
  }
}