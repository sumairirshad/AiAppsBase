-- 005_add_github_integration.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS github_username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_access_token TEXT;

ALTER TABLE products ADD COLUMN IF NOT EXISTS github_repo_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS github_default_branch TEXT;
