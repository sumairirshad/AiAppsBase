-- 006_add_product_marketplace_fields.sql
-- Columns needed to render real marketplace listings and product detail pages
-- (GitHub-style stats, primary language, version, and feature bullet points).

ALTER TABLE products ADD COLUMN IF NOT EXISTS language          TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS language_color    TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stars             INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS forks             INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS watchers          INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS commits           INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS contributors      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS version           TEXT NOT NULL DEFAULT '1.0.0';
ALTER TABLE products ADD COLUMN IF NOT EXISTS features          TEXT[] NOT NULL DEFAULT '{}';

-- Helpful indexes for marketplace filtering / sorting.
CREATE INDEX IF NOT EXISTS idx_products_status     ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
