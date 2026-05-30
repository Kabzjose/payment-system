CREATE TABLE customers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id  VARCHAR(255) NOT NULL UNIQUE,
  default_currency    VARCHAR(3) NOT NULL DEFAULT 'usd',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_stripe_id ON customers(stripe_customer_id);