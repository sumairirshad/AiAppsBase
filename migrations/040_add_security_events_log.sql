-- 040_add_security_events_log.sql
--
-- AUD finding: account-security-sensitive events had no durable audit
-- trail. A failed login only ever bumped an ephemeral counter
-- (users.login_failed_attempts) that resets to 0 the moment a correct
-- password follows — there was no lasting record of "this account was
-- hit with repeated failed login attempts on this date", which is exactly
-- the kind of evidence needed to investigate a suspected account-takeover
-- attempt after the fact. Password changes had no record at all: not the
-- successful change, and not a failed attempt with the wrong current
-- password.
--
-- security_events is append-only, same pattern as download_audit_log
-- (migration 038) and audit_logs (migration 010_admin_panel) — see
-- lib/security-events.ts, which only ever INSERTs. No admin UI exposes an
-- edit/delete action on it.
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_failed', 'login_locked', 'password_changed', 'password_change_failed'
  )),
  ip_address TEXT,
  user_agent TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
