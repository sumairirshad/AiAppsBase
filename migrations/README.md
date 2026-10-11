# Migrations

Plain numbered SQL files, applied in order by `scripts/migrate.js`. Each
applied filename is recorded in the `migrations` table, so a file is never
re-run once it has shipped to an environment.

## Why some numbers repeat

`005`, `009`, and `010` each name two or three files
(`005_add_github_integration.sql` / `005_add_stripe_sessions.sql`, etc.).
That's a leftover from merging work that was branched in parallel, not a
typo to fix now. `scripts/migrate.js` sorts by the **full filename**, not
just the numeric prefix, so the order is still fully deterministic — it's
just alphabetical among files sharing a number, rather than number order.

Renumbering them would be the obvious cleanup, but it's not safe to do
after the fact: the `migrations` table on every already-deployed
environment keys off the exact filename, so renaming a file that has
already run makes `migrate.js` treat it as new and try to re-run it,
which fails the moment it hits a `CREATE TABLE` or `ADD COLUMN` that isn't
idempotent. Leaving the numbers as they are is the deliberate choice here.

Going forward, give each new migration the next unused number so this
doesn't get worse.
