-- 014_add_ranking_indexes.sql
-- Supports the ranking catalog snapshot (src/lib/ranking/catalog.ts).
-- The snapshot aggregates reviews, orders and wishlists per product once per
-- minute per server instance; per-product lookups of the same data (product
-- pages, wishlist counts) need product_id-leading indexes. reviews and orders
-- already have them via their (product_id, ...) unique constraints; wishlists'
-- unique constraint leads with user_id, so it needs its own.

CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_products_status_seller ON products(status, seller_id);
