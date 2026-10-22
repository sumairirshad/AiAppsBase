-- 032_product_versions_cascade_on_product_delete.sql
-- product_versions.product_id had no ON DELETE action (default RESTRICT).
-- A product can only ever actually be deleted once it has zero orders
-- (orders.product_id has no ON DELETE action either, so any order already
-- blocks the delete long before this FK would be checked) — so by the time
-- a product delete reaches this constraint, none of its versions can have
-- any order referencing them either, and cascading here is always safe.
-- Without this, deleting an order-free product with any published version
-- would fail with an FK violation instead of succeeding as it should.

ALTER TABLE product_versions DROP CONSTRAINT IF EXISTS product_versions_product_id_fkey;
ALTER TABLE product_versions
  ADD CONSTRAINT product_versions_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
