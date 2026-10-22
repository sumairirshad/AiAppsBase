-- 032_add_github_snapshot_tracking.sql
--
-- Repo-delivered products used to serve a live GitHub zipball at download
-- time: either an unauthenticated redirect to the public archive URL (404s
-- for private repos, for every buyer, forever) or a per-download proxy
-- through the seller's stored OAuth token (ties every past buyer's download
-- to the seller's GitHub connection staying valid indefinitely).
--
-- Instead, the repo is snapshotted into the exact same deliverable storage
-- manual-upload products already use (deliverable_remote_path /
-- deliverable_original_name / deliverable_size_bytes) — once, at
-- admin-approval time, and again whenever the seller explicitly refreshes
-- it. Buyer downloads then stream that stored file, the same as a
-- manual-upload product, and never touch GitHub at request time.
--
-- These columns track the snapshot's own state, independent of the
-- product's moderation `status`, so a failed refresh never silently
-- clobbers a previously-working snapshot buyers are still downloading.

ALTER TABLE products ADD COLUMN IF NOT EXISTS github_repo_private BOOLEAN;

ALTER TABLE products ADD COLUMN IF NOT EXISTS github_snapshot_status TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_github_snapshot_status_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_github_snapshot_status_check
      CHECK (github_snapshot_status IS NULL OR github_snapshot_status IN ('pending', 'ready', 'failed'));
  END IF;
END $$;

ALTER TABLE products ADD COLUMN IF NOT EXISTS github_snapshot_commit_sha TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS github_snapshot_fetched_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS github_snapshot_error TEXT;
