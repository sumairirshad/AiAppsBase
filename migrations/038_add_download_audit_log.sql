-- 038_add_download_audit_log.sql
--
-- AUD finding: /api/orders/[id]/download streamed the deliverable straight
-- back to the buyer without ever recording that the attempt happened. There
-- was no way to answer "did the seller deliver?" or "did the buyer actually
-- download it?" for a dispute -- the only evidence was the order's
-- completed status and the deliverable's existence, neither of which says
-- anything about what the buyer did with it.
--
-- download_audit_log is an append-only record of every download attempt
-- (successful, blocked, or failed) against an order, tying together the
-- buyer, the seller, the exact deliverable (file name + sha256, inherited
-- from product_versions), and the request's IP/user-agent. Nothing in the
-- app ever updates or deletes a row here -- see lib/download-audit.ts,
-- which only ever INSERTs -- so it stands as tamper-resistant evidence
-- independent of either party's own claims. No admin UI exposes an
-- edit/delete action on it either.
CREATE TABLE IF NOT EXISTS download_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  product_version_id UUID REFERENCES product_versions(id),

  file_name TEXT,
  file_sha256 TEXT,
  file_size_bytes BIGINT,

  ip_address TEXT,
  user_agent TEXT,

  -- 'success' = bytes were streamed to the buyer; 'blocked' = refused before
  -- streaming anything (not entitled, order not completed, nothing to
  -- deliver); 'failed' = an attempt that should have succeeded but errored
  -- (storage unreachable, etc).
  status TEXT NOT NULL CHECK (status IN ('success', 'blocked', 'failed')),
  block_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_audit_log_order ON download_audit_log(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_audit_log_buyer ON download_audit_log(buyer_id);
CREATE INDEX IF NOT EXISTS idx_download_audit_log_seller ON download_audit_log(seller_id);
