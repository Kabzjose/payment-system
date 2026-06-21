-- Add account suspension fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS suspended_at       TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason  TEXT        DEFAULT NULL;
