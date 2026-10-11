-- 029_add_cart_checkout_support.sql
-- A single Stripe Checkout Session can now cover every item in a buyer's
-- cart at once, so checkout_sessions needs to allow more than one row per
-- stripe_session_id — one row per product in that session — instead of the
-- exactly-one-row-per-session the old UNIQUE(stripe_session_id) assumed.

ALTER TABLE checkout_sessions DROP CONSTRAINT IF EXISTS checkout_sessions_stripe_session_id_key;

-- Replaces idx_checkout_sessions_stripe_id (005_add_stripe_sessions.sql):
-- this composite index's leading column already serves every lookup that
-- plain single-column index did, and it's also what makes "one row per
-- product per session" an enforced guarantee rather than just a convention.
DROP INDEX IF EXISTS idx_checkout_sessions_stripe_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_id_product_id
  ON checkout_sessions(stripe_session_id, product_id);
