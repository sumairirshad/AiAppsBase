-- 010_add_orders_integrity.sql
-- Prevents duplicate orders for the same buyer/product under concurrent
-- requests (e.g. double-submitted checkout verification), and indexes the
-- foreign keys that every dashboard/product query joins or filters on.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_product_buyer_unique'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_product_buyer_unique UNIQUE (product_id, buyer_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
