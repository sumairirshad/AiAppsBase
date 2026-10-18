-- 033_product_versions_seller_cascade.sql
-- product_versions.seller_id defaulted to RESTRICT, which (unlike the
-- product_id FK fixed in 032) blocks deleting a user who still has
-- product_versions rows even when those rows are about to be cascade-
-- removed anyway via products.seller_id -> products.id -> product_versions
-- in the very same statement: Postgres checks each FK's RESTRICT
-- independently rather than only after the whole cascade graph settles, so
-- a direct RESTRICT reference from product_versions back to users blocks
-- regardless. Matches seller_id's behavior everywhere else a child row
-- also cascades from products (reviews, wishlists, etc.) by product_id.

ALTER TABLE product_versions DROP CONSTRAINT IF EXISTS product_versions_seller_id_fkey;
ALTER TABLE product_versions
  ADD CONSTRAINT product_versions_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE;
