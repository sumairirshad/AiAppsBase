-- 019_add_newsletter_subscribers.sql
-- Newsletter signup was a client-only setTimeout stub with nowhere to
-- actually store a subscriber.

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
