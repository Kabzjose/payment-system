CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index email for fast lookups during login
CREATE INDEX idx_users_email ON users(email);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

CREATE INDEX idx_users_suspended ON users(suspended_at) WHERE suspended_at IS NOT NULL;

CREATE INDEX idx_users_is_admin ON users(is_admin) WHERE is_admin = true;