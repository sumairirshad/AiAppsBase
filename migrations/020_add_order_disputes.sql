-- 020_add_order_disputes.sql
-- orders.status already had a 'disputed' value, but nothing in the app
-- ever set it and there was nowhere to record why or how it was resolved.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS disputed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispute_resolution TEXT
  CHECK (dispute_resolution IN ('upheld', 'rejected'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispute_resolved_at TIMESTAMPTZ;
