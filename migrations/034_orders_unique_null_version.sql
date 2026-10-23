-- 034_orders_unique_null_version.sql
--
-- Closes a gap in migration 030's order-uniqueness guarantee. That
-- migration added:
--   idx_orders_checkout_session_product  ON orders(stripe_checkout_session_id, product_id)
--   idx_orders_buyer_product_version     ON orders(buyer_id, product_id, product_version_id)
--
-- Postgres never treats two NULLs as equal in a unique index, so neither
-- index catches two orders for the same buyer + product that both end up
-- with product_version_id = NULL. That happens whenever a product is
-- approved but has no resolved current_version_id yet (e.g. a GitHub
-- product still waiting on its first admin-approval snapshot) --
-- completeCheckoutSession() in lib/orders.ts falls back to NULL in exactly
-- that case. Two separate Stripe checkout sessions for such a product (two
-- browser tabs, a retried request, etc.) each get their own
-- stripe_checkout_session_id, so the first index doesn't catch the
-- collision either -- both inserts succeed, and the buyer ends up with two
-- orders (and was charged twice).
--
-- This adds the missing case as its own partial unique index: at most one
-- order per (buyer, product) when the version is unresolved. No application
-- code change is required -- completeCheckoutSession already inserts with
-- `ON CONFLICT DO NOTHING` (no explicit target), which responds to a
-- violation of ANY unique constraint on the table, so it starts correctly
-- rejecting the second insert the moment this constraint exists.

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_buyer_product_null_version
  ON orders(buyer_id, product_id) WHERE product_version_id IS NULL;
