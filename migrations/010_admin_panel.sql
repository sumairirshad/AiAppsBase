-- 010_admin_panel.sql
-- Backs the redesigned admin panel with real, enforced state instead of
-- cosmetic-only actions: a single account status per user (replacing the
-- two independent booleans), a seller approval workflow, and an audit trail
-- for every administrative action.

-- --------------------------------------------------------------------------
-- 1. Consolidate is_banned/is_suspended into one account_status.
--    (Block/Suspend/Ban/Deactivate are mutually exclusive real states, not
--    independent flags — a user is in exactly one of them at a time.)
-- --------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';

UPDATE users SET account_status = CASE
  WHEN is_banned THEN 'banned'
  WHEN is_suspended THEN 'suspended'
  ELSE 'active'
END;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE users ADD CONSTRAINT users_account_status_check
  CHECK (account_status IN ('active', 'suspended', 'blocked', 'banned', 'inactive'));

ALTER TABLE users DROP COLUMN IF EXISTS is_banned;
ALTER TABLE users DROP COLUMN IF EXISTS is_suspended;

CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- --------------------------------------------------------------------------
-- 2. Seller approval workflow. Existing sellers are grandfathered in as
--    'approved' so nothing currently live breaks; new signups start
--    'pending' (enforced in the register route).
-- --------------------------------------------------------------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS seller_status TEXT NOT NULL DEFAULT 'approved';

UPDATE users SET seller_status = 'approved' WHERE role = 'seller' AND seller_status IS NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_seller_status_check;
ALTER TABLE users ADD CONSTRAINT users_seller_status_check
  CHECK (seller_status IN ('pending', 'approved', 'rejected', 'suspended', 'banned'));

CREATE INDEX IF NOT EXISTS idx_users_seller_status ON users(seller_status) WHERE role = 'seller';

-- --------------------------------------------------------------------------
-- 3. Audit log for every administrative action (user/seller status changes,
--    product moderation, review removal, etc).
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action         TEXT NOT NULL,
  target_type    TEXT NOT NULL,
  target_id      TEXT NOT NULL,
  reason         TEXT NOT NULL,
  notes          TEXT,
  previous_value JSONB,
  new_value      JSONB,
  ip_address     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id   ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target      ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON audit_logs(created_at DESC);
