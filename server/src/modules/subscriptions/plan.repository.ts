import { db } from '../../config/db';
import { Plan } from '../../types';

export const planRepository = {

  async findAll(): Promise<Plan[]> {
    const { rows } = await db.query<Plan>(
      `SELECT * FROM plans
       WHERE active = true
       ORDER BY amount ASC`
    );
    return rows;
  },

  async findById(id: string): Promise<Plan | null> {
    const { rows } = await db.query<Plan>(
      'SELECT * FROM plans WHERE id = $1',
      [id]
    );
    return rows[0] ?? null;
  },

  async findByStripePriceId(stripePriceId: string): Promise<Plan | null> {
    const { rows } = await db.query<Plan>(
      'SELECT * FROM plans WHERE stripe_price_id = $1',
      [stripePriceId]
    );
    return rows[0] ?? null;
  },

  async create(data: {
    name: string;
    description?: string;
    stripe_product_id: string;
    stripe_price_id: string;
    amount: number;
    currency: string;
    interval: string;
    interval_count?: number;
    trial_period_days?: number;
  }): Promise<Plan> {
    const { rows } = await db.query<Plan>(
      `INSERT INTO plans
         (name, description, stripe_product_id, stripe_price_id,
          amount, currency, interval, interval_count, trial_period_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.name,
        data.description ?? null,
        data.stripe_product_id,
        data.stripe_price_id,
        data.amount,
        data.currency,
        data.interval,
        data.interval_count ?? 1,
        data.trial_period_days ?? 0,
      ]
    );
    return rows[0];
  },

};