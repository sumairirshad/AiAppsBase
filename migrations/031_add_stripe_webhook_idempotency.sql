-- 031_add_stripe_webhook_idempotency.sql
-- The webhook handler relied solely on completeCheckoutSession's own
-- idempotent DB logic for checkout.session.completed. Adding dispute/
-- chargeback handling (charge.dispute.created/closed) needs its own
-- idempotency guard — Stripe explicitly documents that any webhook event
-- may be delivered more than once — so every event type is now recorded
-- here and processed at most once, uniformly.

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
