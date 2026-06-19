CREATE TABLE plans (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  stripe_product_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_price_id   VARCHAR(255) NOT NULL UNIQUE,
  amount            INTEGER NOT NULL,       -- in cents
  currency          VARCHAR(3) NOT NULL DEFAULT 'usd',
  interval          VARCHAR(20) NOT NULL,   -- 'month' or 'year'
  interval_count    INTEGER NOT NULL DEFAULT 1,
  trial_period_days INTEGER DEFAULT 0,
  active            BOOLEAN NOT NULL DEFAULT true,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plans_stripe_price_id ON plans(stripe_price_id);
CREATE INDEX idx_plans_active ON plans(active);

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();