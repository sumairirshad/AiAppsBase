-- 030_add_selected_github_repo.sql
-- The GitHub repos page lets a connected seller pick repositories from a
-- popup instead of always listing every repo on the page. A seller can pick
-- more than one, so this is a one-row-per-repo table rather than a single
-- column on users. The selection is independent of whether a repo has
-- actually been turned into a listed product.

CREATE TABLE IF NOT EXISTS user_selected_github_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repo_full_name TEXT NOT NULL,
  default_branch TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, repo_full_name)
);

CREATE INDEX IF NOT EXISTS idx_user_selected_github_repos_user_id
  ON user_selected_github_repos(user_id);
