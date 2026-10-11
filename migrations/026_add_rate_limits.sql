-- 026_add_rate_limits.sql
-- Backing store for a fixed-window request rate limiter. A plain in-memory
-- counter wouldn't hold up across serverless instances, so counts live here
-- instead, same reasoning as the existing DB-backed login/OTP lockouts.

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
