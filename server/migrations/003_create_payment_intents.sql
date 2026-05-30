CREATE TYPE payment_status AS ENUM (
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
  'succeeded',
  'canceled',
  'failed'
);

CREATE TYPE payment_method_type AS ENUM (
  'card',
  'mpesa'
);

CREATE TABLE payment_intents (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES users(id),
  customer_id               UUID NOT NULL REFERENCES customers(id),
  stripe_payment_intent_id  VARCHAR(255) UNIQUE,
  amount                    INTEGER NOT NULL CHECK (amount > 0),
  currency                  VARCHAR(3) NOT NULL DEFAULT 'usd',
  status                    payment_status NOT NULL DEFAULT 'requires_payment_method',
  payment_method            payment_method_type NOT NULL DEFAULT 'card',
  metadata                  JSONB DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_intents_user_id ON payment_intents(user_id);
CREATE INDEX idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);