import { db } from '../../config/db';
import { PaymentIntent, Transaction } from '../../types';

export const paymentRepository = {

  async createPaymentIntent(data: {
    user_id: string;
    customer_id: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentIntent> {
    const { rows } = await db.query<PaymentIntent>(
      `INSERT INTO payment_intents
         (user_id, customer_id, amount, currency, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.user_id,
        data.customer_id,
        data.amount,
        data.currency,
        JSON.stringify(data.metadata ?? {}),
      ]
    );
    return rows[0];
  },

  async updatePaymentIntent(
    id: string,
    data: Partial<Pick<PaymentIntent,
      'status' | 'stripe_payment_intent_id'>>
  ): Promise<PaymentIntent> {
    const { rows } = await db.query<PaymentIntent>(
      `UPDATE payment_intents
       SET status = COALESCE($2, status),
           stripe_payment_intent_id = COALESCE($3, stripe_payment_intent_id),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, data.status ?? null, data.stripe_payment_intent_id ?? null]
    );
    return rows[0];
  },

  async findById(id: string): Promise<PaymentIntent | null> {
    const { rows } = await db.query<PaymentIntent>(
      'SELECT * FROM payment_intents WHERE id = $1',
      [id]
    );
    return rows[0] ?? null;
  },

  async findByUserId(userId: string): Promise<PaymentIntent[]> {
    const { rows } = await db.query<PaymentIntent>(
      `SELECT * FROM payment_intents
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  },

  async createTransaction(data: {
    payment_intent_id: string;
    amount: number;
    currency: string;
    type: 'charge' | 'refund' | 'partial_refund';
    status: 'pending' | 'succeeded' | 'failed';
    stripe_charge_id?: string;
  }): Promise<Transaction> {
    const { rows } = await db.query<Transaction>(
      `INSERT INTO transactions
         (payment_intent_id, amount, currency, type, status, stripe_charge_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.payment_intent_id,
        data.amount,
        data.currency,
        data.type,
        data.status,
        data.stripe_charge_id ?? null,
      ]
    );
    return rows[0];
  },

  async findTransactionsByPaymentIntentId(
    paymentIntentId: string
  ): Promise<Transaction[]> {
    const { rows } = await db.query<Transaction>(
      `SELECT * FROM transactions
       WHERE payment_intent_id = $1
       ORDER BY created_at ASC`,
      [paymentIntentId]
    );
    return rows;
  },

};