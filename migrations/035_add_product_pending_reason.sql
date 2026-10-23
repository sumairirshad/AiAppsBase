-- 035_add_product_pending_reason.sql
--
-- Both the seller-triggered GitHub snapshot refresh (sync-github-snapshot)
-- and the metadata-edit route reset an already-approved product back to
-- 'pending' for re-review -- correct behavior, since the listing's actual
-- content just changed. But nothing distinguished that from a brand-new
-- listing's first-ever 'pending' review: the seller's product list showed
-- an identical generic "Pending" badge either way, so an approved product
-- could silently vanish from the storefront on every refresh with no way
-- to tell, after the fact, why it's pending again.
--
-- This column records why a product is currently pending, so the UI can
-- show that distinctly. NULL means "pending as a new submission" (the
-- default, unchanged case). It's cleared whenever an admin makes any
-- decision on the product (approve/reject/suspend/pending), since at that
-- point the "why" is resolved.

ALTER TABLE products ADD COLUMN IF NOT EXISTS pending_reason TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_pending_reason_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_pending_reason_check
      CHECK (pending_reason IS NULL OR pending_reason IN ('content_updated', 'edited'));
  END IF;
END $$;
