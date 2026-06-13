import Stripe from 'stripe';
import { db } from '../../../config/db';
import { logger } from '../../../utils/logger';

export async function handlePaymentIntentFailed(
  event: Stripe.Event
): Promise<void> {
  const stripeIntent = event.data.object;
  const localId = stripeIntent.metadata?.localPaymentIntentId;

  if (!localId) {
    logger.warn({ stripeId: stripeIntent.id }, 'No localPaymentIntentId in metadata');
    return;
  }

  const failureMessage = stripeIntent.last_payment_error?.message ?? 'Payment failed';
  const failureCode = stripeIntent.last_payment_error?.code ?? 'unknown';

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE payment_intents
      SET status = 'failed',
    metadata = metadata || $2::jsonb,
    updated_at = NOW()
    WHERE id = $1
    AND status IN ('pending', 'processing');`,
      [localId, JSON.stringify({ failure_message: failureMessage, failure_code: failureCode })]
    );

    // Record the failed transaction
    await client.query(
      `INSERT INTO transactions
         (payment_intent_id, amount, currency, type, status)
       VALUES ($1, $2, $3, 'charge', 'failed')`,
      [localId, stripeIntent.amount, stripeIntent.currency]
    );

    await client.query('COMMIT');

    logger.info(
      { localId, failureCode, failureMessage },
      'PaymentIntent failed'
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}