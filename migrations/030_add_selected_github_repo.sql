-- 030_add_selected_github_repo.sql
-- The GitHub repos page now asks a connected seller to pick a single repo
-- from a popup instead of always listing every repo on the page. That pick
-- needs to persist per-seller across sessions/devices, so it lives on the
-- users row alongside the other github_* columns rather than in browser
-- storage.

ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_github_repo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_github_repo_branch TEXT;
