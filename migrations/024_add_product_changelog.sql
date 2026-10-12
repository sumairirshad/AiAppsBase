-- 024_add_product_changelog.sql
-- The product detail page has a real "Changelog" tab UI, but
-- src/lib/products.ts set `changelog: []` unconditionally — there was no
-- table backing it, so every product showed an empty timeline.

CREATE TABLE IF NOT EXISTS product_changelog (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version    TEXT NOT NULL,
  notes      TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_changelog_product_id ON product_changelog(product_id);
