-- 025_add_product_issues_column.sql
-- src/lib/products.ts has always read row.issues for the "Issues" stat
-- tile on the product detail page, but products never had an issues
-- column at all — it was permanently undefined, defaulting to 0 for
-- every product regardless of its real GitHub issue count.

ALTER TABLE products ADD COLUMN IF NOT EXISTS issues INTEGER NOT NULL DEFAULT 0;
