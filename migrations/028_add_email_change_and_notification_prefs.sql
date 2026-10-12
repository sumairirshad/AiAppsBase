-- 028_add_email_change_and_notification_prefs.sql
-- Email changes go through a confirmation link to the new address (same
-- token-hash + expiry shape as password_reset_*) instead of taking effect
-- immediately, since email doubles as the sign-in identity. A single
-- email_notifications_enabled flag lets a user opt out of the non-essential
-- emails (moderation decisions, payout status) while receipts, OTPs, and
-- password/email-change links keep sending regardless.

ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_token_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_change_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;
