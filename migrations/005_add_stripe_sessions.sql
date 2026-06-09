CREATE TABLE IF NOT EXISTS checkout_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT        UNIQUE NOT NULL,
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id       UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  license_type     TEXT        NOT NULL,
  amount           NUMERIC(10,2) NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL,
  completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_stripe_id ON checkout_sessions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id   ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status    ON checkout_sessions(status);
