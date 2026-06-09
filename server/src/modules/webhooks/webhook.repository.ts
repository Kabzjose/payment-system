import { db } from '../../config/db';
import { WebhookEvent } from '../../types';

export const webhookRepository = {

  async findByStripeEventId(stripeEventId: string): Promise<WebhookEvent | null> {
    const { rows } = await db.query<WebhookEvent>(
      'SELECT * FROM webhook_events WHERE stripe_event_id = $1 LIMIT 1',
      [stripeEventId]
    );
    return rows[0] ?? null;
  },

  async create(data: {
    stripe_event_id: string;
    event_type: string;
    payload: Record<string, unknown>;
  }): Promise<WebhookEvent> {
    const { rows } = await db.query<WebhookEvent>(
      `INSERT INTO webhook_events (stripe_event_id, event_type, payload)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.stripe_event_id, data.event_type, JSON.stringify(data.payload)]
    );
    return rows[0];
  },

  async markProcessed(id: string): Promise<void> {
    await db.query(
      `UPDATE webhook_events
       SET status = 'processed', processed_at = NOW()
       WHERE id = $1`,
      [id]
    );
  },

  async markFailed(id: string, error: string): Promise<void> {
    await db.query(
      `UPDATE webhook_events
       SET status = 'failed', error = $2, processed_at = NOW()
       WHERE id = $1`,
      [id, error]
    );
  },

  async markIgnored(id: string): Promise<void> {
    await db.query(
      `UPDATE webhook_events
       SET status = 'ignored', processed_at = NOW()
       WHERE id = $1`,
      [id]
    );
  },

};