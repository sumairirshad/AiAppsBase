-- 013_add_seller_profile.sql
-- Public profile fields rendered on the seller storefront (/seller/[id]).
-- All optional; sellers edit them from Panel → Settings.

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio         TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location    TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website_url TEXT;

CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products(seller_id, status);
