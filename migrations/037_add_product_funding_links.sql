-- 037_add_product_funding_links.sql
--
-- GitHub-sourced listings can declare sponsorship/donation links via
-- .github/FUNDING.yml (GitHub Sponsors, Patreon, Ko-fi, Buy Me a Coffee,
-- Open Collective, a custom URL, etc). Detected at sync time (see
-- src/lib/github-funding.ts) and stored here as a normalized
-- [{ platform, url }] array so the marketplace can show a "Support the
-- developer" action without re-fetching GitHub on every page view.

ALTER TABLE products ADD COLUMN IF NOT EXISTS funding_links JSONB DEFAULT '[]'::jsonb;
