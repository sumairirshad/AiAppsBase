-- 012_add_password_reset.sql
-- The forgot/reset-password pages previously had no backend at all — a user
-- who lost their password had no way back into their account. Stores only a
-- hash of the reset token (never the raw token) so a DB read can't be used
-- to reset accounts directly.

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token_hash ON users(password_reset_token_hash);
