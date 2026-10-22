-- 031_reconcile_selected_github_repo_table.sql
-- Migrations are tracked by filename, not content. Some environments may
-- already have run 030_add_selected_github_repo.sql back when it still
-- added single selected_github_repo / selected_github_repo_branch columns
-- to users, before that file was edited (on the same, still-unmerged
-- branch) to create user_selected_github_repos instead. Those environments
-- never re-run 030 under its new content, so they're left with the stale
-- columns and no table — which is exactly what broke the GitHub repos page
-- (every /api/seller/github/repos request querying the missing table 500s).
--
-- This reconciles both possible histories: create the table if it isn't
-- there yet (no-op if 030 already created it), carry over any single-column
-- selection that exists, then drop the old columns for good.

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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'selected_github_repo'
  ) THEN
    INSERT INTO user_selected_github_repos (user_id, repo_full_name, default_branch)
    SELECT id, selected_github_repo, COALESCE(selected_github_repo_branch, 'main')
    FROM users
    WHERE selected_github_repo IS NOT NULL
    ON CONFLICT (user_id, repo_full_name) DO NOTHING;

    ALTER TABLE users DROP COLUMN selected_github_repo;
    ALTER TABLE users DROP COLUMN IF EXISTS selected_github_repo_branch;
  END IF;
END $$;
