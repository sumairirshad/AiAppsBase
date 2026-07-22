-- 009_add_github_login.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_github_id_unique'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_github_id_unique UNIQUE (github_id);
  END IF;
END $$;
