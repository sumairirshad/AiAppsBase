-- 021_add_order_commission_snapshot.sql
-- Orders never recorded what commission rate applied at sale time. The
-- platform fee percent can change (env var today, an admin-editable
-- setting soon), and seller payouts are computed off the *current* rate —
-- without a snapshot there's no way to later reconstruct what rate actually
-- applied to a historical sale for an audit or a dispute.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate_snapshot NUMERIC(5,2);
