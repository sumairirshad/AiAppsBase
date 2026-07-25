-- 009_add_product_subcategory.sql
-- Adds a subcategory dimension under the existing top-level `category`
-- so listings can be organized as Main Category -> Subcategory
-- (e.g. "Websites" -> "Landing Pages & Marketing").

ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;

CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
