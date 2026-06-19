import { db } from '../../config/db';
import { Subscription, SubscriptionWithPlan } from '../../types';

export const subscriptionRepository = {

  async findByUserId(userId: string): Promise<SubscriptionWithPlan[]> {
    const { rows } = await db.query<SubscriptionWithPlan>(
      `SELECT
         s.*,
         row_to_json(p.*) as plan
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async findById(id: string): Promise<SubscriptionWithPlan | null> {
    const { rows } = await db.query<SubscriptionWithPlan>(
      `SELECT
         s.*,
         row_to_json(p.*) as plan
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async findByStripeSubscriptionId(
    stripeSubId: string
  ): Promise<Subscription | null> {
    const { rows } = await db.query<Subscription>(
      'SELECT * FROM subscriptions WHERE stripe_subscription_id = $1',
      [stripeSubId]
    );
    return rows[0] ?? null;
  },

  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    const { rows } = await db.query<Subscription>(
      `SELECT * FROM subscriptions
       WHERE user_id = $1
         AND status IN ('active', 'trialing', 'past_due')
       LIMIT 1`,
      [userId]
    );
    return rows[0] ?? null;
  },

  async create(data: {
    user_id: string;
    plan_id: string;
    stripe_subscription_id: string;
    stripe_customer_id: string;
    stripe_price_id: string;
    status: string;
    current_period_start?: Date;
    current_period_end?: Date;
    trial_start?: Date;
    trial_end?: Date;
  }): Promise<Subscription> {
    const { rows } = await db.query<Subscription>(
      `INSERT INTO subscriptions
         (user_id, plan_id, stripe_subscription_id, stripe_customer_id,
          stripe_price_id, status, current_period_start, current_period_end,
          trial_start, trial_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.user_id,
        data.plan_id,
        data.stripe_subscription_id,
        data.stripe_customer_id,
        data.stripe_price_id,
        data.status,
        data.current_period_start ?? null,
        data.current_period_end ?? null,
        data.trial_start ?? null,
        data.trial_end ?? null,
      ]
    );
    return rows[0];
  },

  async update(
    stripeSubId: string,
    data: Partial<{
      status: string;
      plan_id: string;
      stripe_price_id: string;
      current_period_start: Date;
      current_period_end: Date;
      cancel_at_period_end: boolean;
      canceled_at: Date;
      trial_start: Date;
      trial_end: Date;
    }>
  ): Promise<Subscription> {
    const { rows } = await db.query<Subscription>(
      `UPDATE subscriptions SET
         status               = COALESCE($2, status),
         plan_id              = COALESCE($3, plan_id),
         stripe_price_id      = COALESCE($4, stripe_price_id),
         current_period_start = COALESCE($5, current_period_start),
         current_period_end   = COALESCE($6, current_period_end),
         cancel_at_period_end = COALESCE($7, cancel_at_period_end),
         canceled_at          = COALESCE($8, canceled_at),
         trial_start          = COALESCE($9, trial_start),
         trial_end            = COALESCE($10, trial_end),
         updated_at           = NOW()
       WHERE stripe_subscription_id = $1
       RETURNING *`,
      [
        stripeSubId,
        data.status ?? null,
        data.plan_id ?? null,
        data.stripe_price_id ?? null,
        data.current_period_start ?? null,
        data.current_period_end ?? null,
        data.cancel_at_period_end ?? null,
        data.canceled_at ?? null,
        data.trial_start ?? null,
        data.trial_end ?? null,
      ]
    );
    return rows[0];
  },

};