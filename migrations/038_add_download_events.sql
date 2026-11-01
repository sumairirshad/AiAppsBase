-- 038_add_download_events.sql
--
-- Tracks each time a buyer actually downloads the deliverable for one of
-- their completed orders, so the Buyer Portal's Download History page can
-- show a real "last downloaded" timestamp per order instead of just the
-- purchase date. Logged from the download route itself, only once the file
-- has actually started streaming back to the buyer (see
-- src/lib/download-history.ts) — never on a failed/unauthorized attempt.

CREATE TABLE IF NOT EXISTS download_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_version_id UUID REFERENCES product_versions(id) ON DELETE SET NULL,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-order lookup (MAX(downloaded_at)/COUNT(*) for the history page) and
-- per-buyer lookup, both newest-first.
CREATE INDEX IF NOT EXISTS idx_download_events_order ON download_events(order_id, downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_events_buyer ON download_events(buyer_id, downloaded_at DESC);
