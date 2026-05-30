CREATE TYPE transaction_type AS ENUM ('charge', 'refund', 'partial_refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'succeeded', 'failed');

CREATE TABLE transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_intent_id   UUID NOT NULL REFERENCES payment_intents(id),
  amount              INTEGER NOT NULL CHECK (amount > 0),
  currency            VARCHAR(3) NOT NULL,
  type                transaction_type NOT NULL,
  status              transaction_status NOT NULL DEFAULT 'pending',
  stripe_charge_id    VARCHAR(255) UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_payment_intent_id ON transactions(payment_intent_id);