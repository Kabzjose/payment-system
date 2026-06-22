import { db } from '../../config/db';

export const adminRepository = {

  // ── Overview stats ────────────────────────────────────────────────────────
  // One query using CTEs to get all four dashboard numbers at once.
  // CTEs (Common Table Expressions) are named subqueries — each one
  // computes one piece of data, then the final SELECT combines them all.
  async getStats() {
    const { rows } = await db.query(`
      WITH
        stripe_revenue AS (
          SELECT COALESCE(SUM(amount), 0) AS total
          FROM payment_intents
          WHERE status = 'succeeded'
        ),
        mpesa_revenue AS (
          SELECT COALESCE(SUM(amount * 100), 0) AS total
          FROM mpesa_payments
          WHERE status = 'succeeded'
        ),
        user_count AS (
          SELECT COUNT(*) AS total FROM users
        ),
        admin_count AS (
          SELECT COUNT(*) AS total FROM users WHERE is_admin = true
        ),
        active_subs AS (
          SELECT COUNT(*) AS total
          FROM subscriptions
          WHERE status IN ('active', 'trialing')
        ),
        past_due_subs AS (
          SELECT COUNT(*) AS total
          FROM subscriptions
          WHERE status = 'past_due'
        ),
        failed_payments AS (
          SELECT COUNT(*) AS total
          FROM payment_intents
          WHERE status = 'failed'
        ),
        failed_mpesa AS (
          SELECT COUNT(*) AS total
          FROM mpesa_payments
          WHERE status IN ('failed', 'cancelled')
        ),
        plan_breakdown AS (
          SELECT
            p.name,
            p.amount,
            p.currency,
            COUNT(s.id) AS subscriber_count
          FROM plans p
          LEFT JOIN subscriptions s
            ON s.plan_id = p.id
            AND s.status IN ('active', 'trialing')
          GROUP BY p.id, p.name, p.amount, p.currency
          ORDER BY p.amount ASC
        )
      SELECT
        (SELECT total FROM stripe_revenue) +
        (SELECT total FROM mpesa_revenue)        AS total_revenue_cents,
        (SELECT total FROM stripe_revenue)       AS stripe_revenue_cents,
        (SELECT total FROM mpesa_revenue)        AS mpesa_revenue_cents,
        (SELECT total FROM user_count)           AS total_users,
        (SELECT total FROM admin_count)          AS admin_users,
        (SELECT total FROM active_subs)          AS active_subscriptions,
        (SELECT total FROM past_due_subs)        AS past_due_subscriptions,
        (SELECT total FROM failed_payments) +
        (SELECT total FROM failed_mpesa)         AS failed_payments,
        (SELECT json_agg(plan_breakdown)
         FROM plan_breakdown)                    AS plan_breakdown
    `);

    return rows[0];
  },

  // ── All payments (paginated) ──────────────────────────────────────────────
  // Combines Stripe and M-Pesa payments into one unified list using UNION ALL.
  // UNION ALL keeps duplicates (unlike UNION which deduplicates) —
  // since these are different tables there are no duplicates to worry about.
  async getAllPayments(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    method?: string;
  }) {
    const offset = (params.page - 1) * params.limit;
    const searchFilter = params.search
      ? `AND u.email ILIKE '%${params.search.replace(/'/g, "''")}%'`
      : '';

    const { rows } = await db.query(`
      WITH all_payments AS (
        -- Stripe payments
        SELECT
          pi.id,
          u.id        AS user_id,
          u.email     AS user_email,
          u.name      AS user_name,
          pi.amount,
          pi.currency,
          pi.status::TEXT,
          'card'      AS method,
          pi.created_at,
          pi.stripe_payment_intent_id AS external_id
        FROM payment_intents pi
        JOIN users u ON u.id = pi.user_id
        WHERE 1=1 ${searchFilter}
        ${params.status ? `AND pi.status::TEXT = '${params.status}'` : ''}
        ${params.method && params.method !== 'mpesa' ? '' : ''}

        UNION ALL

        -- M-Pesa payments
        SELECT
          mp.id,
          u.id          AS user_id,
          u.email       AS user_email,
          u.name        AS user_name,
          mp.amount * 100 AS amount,
          'kes'         AS currency,
          mp.status::TEXT,
          'mpesa'       AS method,
          mp.created_at,
          mp.mpesa_receipt_number AS external_id
        FROM mpesa_payments mp
        JOIN users u ON u.id = mp.user_id
        WHERE 1=1 ${searchFilter}
        ${params.status ? `AND mp.status::TEXT = '${params.status}'` : ''}
      )
      SELECT
        *,
        COUNT(*) OVER() AS total_count
      FROM all_payments
      ${params.method ? `WHERE method = '${params.method}'` : ''}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [params.limit, offset]);

    const total = rows[0]?.total_count ? parseInt(rows[0].total_count, 10) : 0;
    const payments = rows.map(({ total_count, ...rest }) => rest);

    return { payments, total, page: params.page, limit: params.limit };
  },

  // ── All users with aggregated data ────────────────────────────────────────
  async getAllUsers(params: { page: number; limit: number; search?: string }) {
    const offset = (params.page - 1) * params.limit;
    const search = params.search ?? '';

    const { rows } = await db.query(`
      SELECT
        u.id,
        u.email,
        u.name,
        u.is_admin,
        u.created_at,

        -- Payment counts and totals
        COALESCE(stripe.payment_count, 0)     AS stripe_payment_count,
        COALESCE(stripe.total_spent, 0)       AS stripe_total_cents,
        COALESCE(mpesa.payment_count, 0)      AS mpesa_payment_count,
        COALESCE(mpesa.total_spent_kes, 0)    AS mpesa_total_kes,

        -- Subscription info
        sub.status                            AS subscription_status,
        p.name                                AS plan_name,

        -- Window function for pagination total
        COUNT(*) OVER()                       AS total_count

      FROM users u

      -- Stripe payment aggregation (LEFT JOIN so users with no payments show up)
      LEFT JOIN (
        SELECT
          user_id,
          COUNT(*) AS payment_count,
          COALESCE(SUM(amount), 0) AS total_spent
        FROM payment_intents
        WHERE status = 'succeeded'
        GROUP BY user_id
      ) stripe ON stripe.user_id = u.id

      -- M-Pesa payment aggregation
      LEFT JOIN (
        SELECT
          user_id,
          COUNT(*) AS payment_count,
          COALESCE(SUM(amount), 0) AS total_spent_kes
        FROM mpesa_payments
        WHERE status = 'succeeded'
        GROUP BY user_id
      ) mpesa ON mpesa.user_id = u.id

      -- Most recent active subscription
      LEFT JOIN LATERAL (
        SELECT status, plan_id
        FROM subscriptions
        WHERE user_id = u.id
          AND status IN ('active', 'trialing', 'past_due')
        ORDER BY created_at DESC
        LIMIT 1
      ) sub ON true

      LEFT JOIN plans p ON p.id = sub.plan_id

      WHERE u.email ILIKE $3

      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, [params.limit, offset, `%${search}%`]);

    const total = rows[0]?.total_count
      ? parseInt(rows[0].total_count, 10)
      : 0;
    const users = rows.map(({ total_count, ...rest }) => rest);

    return { users, total, page: params.page, limit: params.limit };
  },

  // ── Single user detail ────────────────────────────────────────────────────
  async getUserDetail(userId: string) {
    // User info
    const { rows: userRows } = await db.query(
      `SELECT id, email, name, is_admin, suspended_at, suspension_reason, created_at FROM users WHERE id = $1`,
      [userId]
    );
    if (!userRows[0]) return null;

    // Their Stripe payments
    const { rows: stripePayments } = await db.query(
      `SELECT id, amount, currency, status, created_at,
              stripe_payment_intent_id
       FROM payment_intents
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    // Their M-Pesa payments
    const { rows: mpesaPayments } = await db.query(
      `SELECT id, amount, phone_number, status,
              mpesa_receipt_number, created_at
       FROM mpesa_payments
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    // Their subscriptions
    const { rows: subscriptions } = await db.query(
      `SELECT s.*, p.name AS plan_name, p.amount AS plan_amount
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    return {
      user: userRows[0],
      stripePayments,
      mpesaPayments,
      subscriptions,
    };
  },

  // ── Admin refund ──────────────────────────────────────────────────────────
  async findPaymentById(paymentId: string) {
    const { rows } = await db.query(
      `SELECT pi.*, u.email AS user_email
       FROM payment_intents pi
       JOIN users u ON u.id = pi.user_id
       WHERE pi.id = $1`,
      [paymentId]
    );
    return rows[0] ?? null;
  },

  // ── Suspend / unsuspend user ──────────────────────────────────────────────
  async suspendUser(
    userId: string,
    reason: string
  ): Promise<void> {
    await db.query(
      `UPDATE users
       SET suspended_at = NOW(), suspension_reason = $2
       WHERE id = $1`,
      [userId, reason]
    );
  },

  async unsuspendUser(userId: string): Promise<void> {
    await db.query(
      `UPDATE users
       SET suspended_at = NULL, suspension_reason = NULL
       WHERE id = $1`,
      [userId]
    );
  },

  async getUserSuspensionStatus(userId: string) {
    const { rows } = await db.query(
      `SELECT id, email, name, suspended_at, suspension_reason
       FROM users WHERE id = $1`,
      [userId]
    );
    return rows[0] ?? null;
  },

};