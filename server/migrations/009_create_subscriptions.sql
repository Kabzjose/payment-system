CREATE TYPE subscription_status AS ENUM (
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

CREATE TABLE subscriptions (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES users(id),
  plan_id                   UUID NOT NULL REFERENCES plans(id),
  stripe_subscription_id    VARCHAR(255) NOT NULL UNIQUE,
  stripe_customer_id        VARCHAR(255) NOT NULL,
  stripe_price_id           VARCHAR(255) NOT NULL,
  status                    subscription_status NOT NULL DEFAULT 'incomplete',
  current_period_start      TIMESTAMPTZ,
  current_period_end        TIMESTAMPTZ,
  cancel_at_period_end      BOOLEAN NOT NULL DEFAULT false,
  canceled_at               TIMESTAMPTZ,
  trial_start               TIMESTAMPTZ,
  trial_end                 TIMESTAMPTZ,
  metadata                  JSONB DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();