import Stripe from 'stripe';
import { db } from '../../../config/db';
import { logger } from '../../../utils/logger';

export async function handleChargeRefunded(
  event: Stripe.ChargeRefundedEvent
): Promise<void> {
  const charge = event.data.object;

  // Find our payment intent via the stripe charge ID on the transaction
  const { rows } = await db.query(
    `SELECT pi.id, pi.amount, pi.currency
     FROM transactions t
     JOIN payment_intents pi ON pi.id = t.payment_intent_id
     WHERE t.stripe_charge_id = $1
     LIMIT 1`,
    [charge.id]
  );

  if (rows.length === 0) {
    logger.warn({ chargeId: charge.id }, 'No local transaction found for charge');
    return;
  }

  const localIntent = rows[0];

  // Get the most recent refund from this charge
  const latestRefund = charge.refunds?.data?.[0];
  if (!latestRefund) return;

  const isPartial = latestRefund.amount < localIntent.amount;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO transactions
         (payment_intent_id, amount, currency, type, status, stripe_charge_id)
       VALUES ($1, $2, $3, $4, 'succeeded', $5)
       ON CONFLICT (stripe_charge_id) DO NOTHING`,
      [
        localIntent.id,
        latestRefund.amount,
        localIntent.currency,
        isPartial ? 'partial_refund' : 'refund',
        latestRefund.id,
      ]
    );

    await client.query('COMMIT');

    logger.info(
      { intentId: localIntent.id, refundAmount: latestRefund.amount },
      'Refund recorded'
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}