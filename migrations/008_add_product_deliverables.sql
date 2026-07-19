-- 008_add_product_deliverables.sql

ALTER TABLE products ADD COLUMN IF NOT EXISTS deliverable_remote_path TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deliverable_original_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deliverable_size_bytes BIGINT;
