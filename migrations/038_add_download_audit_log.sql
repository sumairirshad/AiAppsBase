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

  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  product_version_id UUID REFERENCES product_versions(id),

  file_name TEXT,
  file_sha256 TEXT,
  file_size_bytes BIGINT,

  ip_address TEXT,
  user_agent TEXT,

  -- What the scan on record for this deliverable said at the moment of this
  -- attempt (see migration 039) -- not re-computed here, just carried over
  -- so a dispute doesn't need a second join to know what the buyer was told.
  scan_status TEXT,

  -- Was a malware warning shown for this attempt, and if so, did the buyer
  -- go through the password + email re-verification override flow (see
  -- lib/download-audit.ts / Phase 3)? warning_shown=false, override_*=NULL
  -- is the overwhelmingly common case: a clean file, no warning needed.
  warning_shown BOOLEAN NOT NULL DEFAULT FALSE,
  override_requested BOOLEAN NOT NULL DEFAULT FALSE,
  override_password_verified BOOLEAN NOT NULL DEFAULT FALSE,
  override_email_verified BOOLEAN NOT NULL DEFAULT FALSE,

  -- 'success' = bytes were streamed to the buyer; 'blocked' = refused before
  -- streaming anything (not entitled, infected with no/failed override,
  -- scan still pending); 'failed' = an attempt that should have succeeded
  -- but errored (storage unreachable, etc).
  status TEXT NOT NULL CHECK (status IN ('success', 'blocked', 'failed')),
  block_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_download_audit_log_order ON download_audit_log(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_audit_log_buyer ON download_audit_log(buyer_id);
CREATE INDEX IF NOT EXISTS idx_download_audit_log_seller ON download_audit_log(seller_id);
