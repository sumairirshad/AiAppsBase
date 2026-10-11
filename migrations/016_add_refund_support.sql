-- 016_add_refund_support.sql
-- Refunds previously had nowhere to record a Stripe refund: orders carried no
-- reference back to the PaymentIntent that charged the buyer, so there was
-- no way to call stripe.refunds.create for an existing order.

ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
