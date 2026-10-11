-- 027_drop_redundant_product_status_index.sql
-- idx_products_status (006_add_product_marketplace_fields.sql) covers
-- "WHERE status = ..." queries, but idx_products_status_seller
-- (014_add_ranking_indexes.sql) is a composite index on (status, seller_id)
-- whose leading column is the same — Postgres can use it for a status-only
-- filter just as well, so the single-column index is dead weight that only
-- costs writes to maintain.

DROP INDEX IF EXISTS idx_products_status;
