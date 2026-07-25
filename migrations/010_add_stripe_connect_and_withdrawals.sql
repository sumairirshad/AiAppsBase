-- 009_add_stripe_connect_and_withdrawals.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_onboarding_status TEXT NOT NULL DEFAULT 'not_started'
  CHECK (stripe_onboarding_status IN ('not_started', 'pending', 'complete'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_account_id_idx
  ON users(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_amount NUMERIC(10,2) NOT NULL CHECK (requested_amount > 0),
  fee_amount NUMERIC(10,2) NOT NULL CHECK (fee_amount >= 0),
  net_amount NUMERIC(10,2) NOT NULL CHECK (net_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'failed')),
  stripe_transfer_id TEXT,
  rejection_reason TEXT,
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS withdrawal_requests_seller_idx ON withdrawal_requests(seller_id);
CREATE INDEX IF NOT EXISTS withdrawal_requests_status_idx ON withdrawal_requests(status);
