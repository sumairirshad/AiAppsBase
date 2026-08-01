-- 011_add_otp_rate_limiting.sql
-- OTP verification and login previously had no brute-force protection: a
-- 6-digit code (or a password) with unlimited guesses is crackable well
-- within a reasonable time window.

ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_locked_until TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN IF NOT EXISTS login_failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_locked_until TIMESTAMPTZ;
