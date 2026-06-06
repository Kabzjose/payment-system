import { db } from '../../config/db';
import { Customer } from '../../types';

export const customerRepository = {

  async findByUserId(userId: string): Promise<Customer | null> {
    const { rows } = await db.query<Customer>(
      'SELECT * FROM customers WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    return rows[0] ?? null;
  },

  async findByStripeCustomerId(stripeCustomerId: string): Promise<Customer | null> {
    const { rows } = await db.query<Customer>(
      'SELECT * FROM customers WHERE stripe_customer_id = $1 LIMIT 1',
      [stripeCustomerId]
    );
    return rows[0] ?? null;
  },

  async create(data: {
    user_id: string;
    stripe_customer_id: string;
    default_currency?: string;
  }): Promise<Customer> {
    const { rows } = await db.query<Customer>(
      `INSERT INTO customers (user_id, stripe_customer_id, default_currency)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.user_id, data.stripe_customer_id, data.default_currency ?? 'usd']
    );
    return rows[0];
  },

};