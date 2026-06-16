CREATE TYPE mpesa_payment_status AS ENUM (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled'
);

CREATE TABLE mpesa_payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id),
  phone_number          VARCHAR(20) NOT NULL,
  amount                INTEGER NOT NULL CHECK (amount > 0),
  account_reference     VARCHAR(255) NOT NULL,
  transaction_desc      VARCHAR(255) NOT NULL,
  checkout_request_id   VARCHAR(255) UNIQUE,
  merchant_request_id   VARCHAR(255),
  status                mpesa_payment_status NOT NULL DEFAULT 'pending',
  mpesa_receipt_number  VARCHAR(255),
  result_code           INTEGER,
  result_desc           TEXT,
  metadata              JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mpesa_payments_user_id ON mpesa_payments(user_id);
CREATE INDEX idx_mpesa_payments_checkout_request_id ON mpesa_payments(checkout_request_id);
CREATE INDEX idx_mpesa_payments_status ON mpesa_payments(status);

CREATE TRIGGER update_mpesa_payments_updated_at
  BEFORE UPDATE ON mpesa_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();