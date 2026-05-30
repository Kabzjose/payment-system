CREATE TYPE webhook_status AS ENUM ('received', 'processed', 'failed', 'ignored');

CREATE TABLE webhook_events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id  VARCHAR(255) NOT NULL UNIQUE,
  event_type       VARCHAR(255) NOT NULL,
  status           webhook_status NOT NULL DEFAULT 'received',
  payload          JSONB NOT NULL,
  error            TEXT,
  processed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- This index is the key to idempotency checks — fast lookup by stripe_event_id
CREATE UNIQUE INDEX idx_webhook_events_stripe_id ON webhook_events(stripe_event_id);