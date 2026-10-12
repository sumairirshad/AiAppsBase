-- 017_add_product_rejection_reason.sql
-- Rejection reasons were only ever captured in audit_logs (admin-side) —
-- products had nowhere to store one, so sellers never saw why their
-- listing was rejected.

ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
