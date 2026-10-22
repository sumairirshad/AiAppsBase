-- 030_add_product_versioning_and_notifications.sql
--
-- Introduces immutable product versions, purchase-specific version
-- entitlements, and a buyer notification system for new version releases.
-- Entirely additive: no column or table is dropped, no existing row is
-- deleted, and every new FK/constraint is backfilled before being relied on.
--
-- Design summary (see also src/lib/product-versions.ts):
--   * product_versions is the new source of truth for "what deliverable did
--     this product ship at version X" — for both upload (zip/rar) and
--     github-sourced products. For github, the *immutable snapshot archive*
--     (fetched at a specific commit SHA and stored on our own SFTP) is what
--     downloads are served from, never a live call back to GitHub — so a
--     disconnected/renamed/deleted upstream repo can never break a buyer's
--     existing download.
--   * products.current_version_id points at the currently published version;
--     new purchases bind to it. products.deliverable_remote_path /
--     github_repo_name / github_default_branch are left untouched for
--     backward compatibility with any code that still reads them directly,
--     but orders now resolve their deliverable through product_versions.
--   * orders.product_version_id is the purchase-specific entitlement. Every
--     existing product gets exactly one backfilled "legacy" version built
--     from its current deliverable/repo pointer (the best available
--     evidence — the exact file a historical buyer originally received is
--     not reconstructable, since the old schema never snapshotted it). Every
--     existing completed order is backfilled to point at that version, so
--     existing buyers' downloads keep working exactly as before.
--   * buyer_notifications is deliberately UNIQUE(buyer_id, product_version_id)
--     so dispatch is idempotent — re-running the notify step for the same
--     published version is always safe.

-- ---------------------------------------------------------------------------
-- 1. product_versions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  version TEXT NOT NULL,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('upload', 'github')),

  -- Populated once the deliverable is confirmed stored. For delivery_type =
  -- 'github' this is the immutable per-commit snapshot archive we fetched
  -- and stored ourselves, not a pointer back to GitHub.
  deliverable_remote_path TEXT,
  deliverable_original_name TEXT,
  deliverable_size_bytes BIGINT,
  deliverable_sha256 TEXT,

  -- GitHub provenance metadata, kept for display/audit even though downloads
  -- never depend on GitHub still being reachable once published.
  github_repo_name TEXT,
  github_branch TEXT,
  github_commit_sha TEXT,

  release_notes TEXT,
  notify_buyers BOOLEAN NOT NULL DEFAULT FALSE,
  notification_dispatch_status TEXT NOT NULL DEFAULT 'not_requested'
    CHECK (notification_dispatch_status IN ('not_requested', 'pending', 'sent', 'failed')),

  status TEXT NOT NULL DEFAULT 'publishing' CHECK (status IN ('publishing', 'published', 'failed')),
  is_legacy_snapshot BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  CONSTRAINT product_versions_delivery_source_exclusive CHECK (
    (delivery_type = 'upload' AND github_repo_name IS NULL)
    OR (delivery_type = 'github' AND github_repo_name IS NOT NULL)
  ),
  -- A published version must have a verified, stored deliverable; a
  -- publishing/failed one may not yet (or may never).
  CONSTRAINT product_versions_published_has_deliverable CHECK (
    status <> 'published' OR deliverable_remote_path IS NOT NULL
  )
);

-- A version string can be "reserved" (status='publishing') or already live
-- (status='published') at most once per product at a time — this is the
-- DB-level backstop behind the advisory-lock + pre-check in
-- publishProductVersion() that makes concurrent publish attempts safe.
-- 'failed' rows are deliberately excluded so a retry can reuse the same
-- version string after a failed attempt.
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_versions_unique_active
  ON product_versions(product_id, version) WHERE status IN ('publishing', 'published');

CREATE INDEX IF NOT EXISTS idx_product_versions_product ON product_versions(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_versions_seller ON product_versions(seller_id);

-- ---------------------------------------------------------------------------
-- 2. products.current_version_id
-- ---------------------------------------------------------------------------

ALTER TABLE products ADD COLUMN IF NOT EXISTS current_version_id UUID REFERENCES product_versions(id);
CREATE INDEX IF NOT EXISTS idx_products_current_version ON products(current_version_id);

-- Non-negative price at the database level (AUD finding: price was only
-- ever validated client-side / best-effort server-side parsing).
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_price_non_negative;
ALTER TABLE products ADD CONSTRAINT products_price_non_negative CHECK (price >= 0);

-- Delivery-source exclusivity at the database level (AUD finding: nothing
-- prevented a product row from ending up with both an uploaded deliverable
-- and a GitHub repo, or neither, set at once).
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_delivery_source_exclusive;
ALTER TABLE products ADD CONSTRAINT products_delivery_source_exclusive CHECK (
  NOT (github_repo_name IS NOT NULL AND deliverable_remote_path IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- 3. Backfill: one legacy product_versions row per existing product that has
--    a deliverable, using whatever the product row currently points at. This
--    is the best available evidence of "the version a historical buyer
--    received" — the pre-versioning schema never snapshotted the exact file
--    at purchase time, so this is a documented, deliberate approximation,
--    not a claim that it reconstructs history exactly.
-- ---------------------------------------------------------------------------

-- Note: a legacy GitHub-sourced product has no deliverable_remote_path (no
-- commit SHA or snapshot was ever recorded by the pre-versioning schema, and
-- this migration must not reach out to GitHub itself to create one). Such a
-- row is inserted with status='failed' — it can never satisfy the
-- "published rows must have a deliverable" CHECK above, so it's excluded
-- below from being set as products.current_version_id. Its downloads keep
-- working exactly as before migration: the download route falls back to the
-- product's live github_repo_name/github_default_branch whenever the
-- resolved version has no stored snapshot. This is the one honestly-
-- documented limitation: a legacy GitHub product's "version 1.0.0" is a
-- label, not a reproducible snapshot, until the seller explicitly publishes
-- a real version through the new flow.
INSERT INTO product_versions (
  product_id, seller_id, version, delivery_type,
  deliverable_remote_path, deliverable_original_name, deliverable_size_bytes,
  github_repo_name, github_branch,
  status, is_legacy_snapshot, created_at, published_at
)
SELECT
  p.id, p.seller_id, COALESCE(NULLIF(TRIM(p.version), ''), '1.0.0'),
  CASE WHEN p.github_repo_name IS NOT NULL THEN 'github' ELSE 'upload' END,
  p.deliverable_remote_path, p.deliverable_original_name, p.deliverable_size_bytes,
  p.github_repo_name, p.github_default_branch,
  CASE WHEN p.github_repo_name IS NOT NULL THEN 'failed' ELSE 'published' END,
  TRUE, p.created_at,
  CASE WHEN p.github_repo_name IS NOT NULL THEN NULL ELSE p.created_at END
FROM products p
WHERE (p.deliverable_remote_path IS NOT NULL OR p.github_repo_name IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM product_versions v WHERE v.product_id = p.id);

UPDATE products p
SET current_version_id = v.id
FROM product_versions v
WHERE v.product_id = p.id AND v.status = 'published'
  AND p.current_version_id IS NULL;

-- ---------------------------------------------------------------------------
-- 4. orders.product_version_id — purchase-specific entitlement
-- ---------------------------------------------------------------------------

ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_version_id UUID REFERENCES product_versions(id);
CREATE INDEX IF NOT EXISTS idx_orders_product_version ON orders(product_version_id);

-- Backfill every existing order to the best available version: the
-- product's current (possibly legacy) published version, or — for a legacy
-- GitHub product that never got a real snapshot — the failed legacy row,
-- since it still carries the correct github_repo_name/branch metadata for
-- the download route's live-repo fallback.
UPDATE orders o
SET product_version_id = v.id
FROM product_versions v
WHERE v.product_id = o.product_id AND v.is_legacy_snapshot
  AND o.product_version_id IS NULL;

-- ---------------------------------------------------------------------------
-- 5. Relax the old "one order per (product, buyer) ever" constraint so a
--    buyer can legitimately repurchase a product after a new version ships
--    (required behavior — see product_versions). Idempotency against
--    duplicate webhook delivery / double-submit is replaced by two more
--    precise guarantees:
--      a) one order per Stripe checkout session per product
--         (idx_orders_checkout_session_product)
--      b) one order per (buyer, product, version) — a buyer can't end up
--         with two orders entitling them to the exact same version
--         (idx_orders_buyer_product_version)
-- ---------------------------------------------------------------------------

ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_product_buyer_unique;

-- Plain (non-partial) unique indexes: Postgres never treats two NULLs as
-- equal, so historical rows backfilled with product_version_id set but no
-- stripe_checkout_session_id (NULL) don't collide with each other, and
-- existing duplicate-prevention behavior for real values is preserved.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_checkout_session_product
  ON orders(stripe_checkout_session_id, product_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_buyer_product_version
  ON orders(buyer_id, product_id, product_version_id);

-- checkout_sessions also snapshots the version being purchased, at session
-- creation time, so a seller publishing a new version while a buyer's
-- Stripe checkout is in flight can never retroactively change what that
-- in-flight purchase resolves to.
ALTER TABLE checkout_sessions ADD COLUMN IF NOT EXISTS product_version_id UUID REFERENCES product_versions(id);

-- ---------------------------------------------------------------------------
-- 6. buyer_notifications — persistent in-app "new version available" feed
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS buyer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_version_id UUID NOT NULL REFERENCES product_versions(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'new_version' CHECK (type IN ('new_version')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_url TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One notification per buyer per published version, however many times
  -- dispatch is retried.
  UNIQUE (buyer_id, product_version_id)
);

CREATE INDEX IF NOT EXISTS idx_buyer_notifications_buyer_unread
  ON buyer_notifications(buyer_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_buyer_notifications_buyer_all
  ON buyer_notifications(buyer_id, created_at DESC);
