# Tisoro LinkedIn Content Scheduler

A content scheduler and publisher for the Tisoro Global LinkedIn Page: compose
posts (text/hiring posts, single images, multi-image albums, video reels,
document carousels, and article-link announcements), schedule them, and have
them published automatically through LinkedIn's official API. Built from the
"Tisoro LinkedIn" content playbook spreadsheet.

Stack: **Next.js** (frontend) + **.NET 8 / ASP.NET Core Web API** (backend) +
**PostgreSQL** (via EF Core + Npgsql).

This folder is fully independent of the `Facebook/` folder next to it — its
own frontend, backend, database, and environment configuration. Nothing here
depends on anything outside `LinkedIn/`.

## What this is (and isn't)

The playbook spreadsheet is an operations/content-strategy document, not a
software spec, so a few things in it are explicitly **not** automated here
because LinkedIn has no public API for them — the spreadsheet itself
describes these as manual admin actions:

- **Native LinkedIn Articles** have no creation API. You publish the article
  on linkedin.com yourself; this app schedules the *announcement post* that
  links to it (content type "Article link share").
- **LinkedIn's Jobs feature** (an actual job listing, Job Post Boost,
  Sponsored Messaging/Message Ads, and LinkedIn Events/Live) are all
  Campaign-Manager/Talent-Hub features with no public creation API, and the
  spreadsheet itself walks through them as manual steps in the LinkedIn UI.
- **Comments/reactions on another member's posts** cannot be done via the API
  on anyone's behalf but your own. The playbook's own "Activity Concept"
  describes this as: AI suggests a comment/reaction, a human posts it
  manually. This app's **Engagement** page tracks those suggestions as a
  checklist — it does not post to LinkedIn on a person's behalf.

What *is* automated end-to-end through LinkedIn's official Community
Management REST API: creating organic Page posts (text, image, multi-image
album, video, document/PDF carousel, article-link share), on a schedule, via
a background publisher.

## Repository layout

```
LinkedIn/
  backend/
    Tisoro.LinkedIn.sln
    src/Tisoro.LinkedIn.Api/       ASP.NET Core Web API
    tests/Tisoro.LinkedIn.Api.Tests/  xUnit tests (unit + real-DB integration)
  frontend/                        Next.js app (App Router, TypeScript)
```

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) and npm
- PostgreSQL 14+ (local install, Docker, or a managed instance)
- A LinkedIn Developer app with access to the **Community Management API**
  product (see [LinkedIn app setup](#linkedin-app-setup) below) — required
  only for actually publishing to LinkedIn; everything else (composing,
  scheduling, the admin UI) works without it.

## 1. Database setup

Create a database (adjust name/credentials as you like):

```bash
psql -U postgres -c "CREATE DATABASE tisoro_linkedin;"
```

The app runs EF Core migrations automatically on startup — there is no
separate "run migrations" step for normal use. To run them manually instead
(e.g. in a deploy pipeline that shouldn't let the app server migrate itself):

```bash
cd backend
dotnet tool install --global dotnet-ef   # once, if you don't have it
export ConnectionStrings__Default="Host=localhost;Port=5432;Database=tisoro_linkedin;Username=postgres;Password=postgres"
dotnet ef database update --project src/Tisoro.LinkedIn.Api --startup-project src/Tisoro.LinkedIn.Api
```

To add a new migration after changing an entity:

```bash
dotnet ef migrations add <Name> --project src/Tisoro.LinkedIn.Api --startup-project src/Tisoro.LinkedIn.Api -o Data/Migrations
```

## 2. Backend setup

```bash
cd backend/src/Tisoro.LinkedIn.Api
cp .env.example .env     # then fill in real values — see below
dotnet restore
dotnet run
```

The API listens on the URL printed at startup (`http://localhost:5253` by
default in the `dotnet run` dev profile). Swagger UI is available at `/swagger`
in Development.

**Environment variables** — see `backend/src/Tisoro.LinkedIn.Api/.env.example`
for the full list with explanations. Required to start at all:

| Variable | Purpose |
|---|---|
| `ConnectionStrings__Default` | Postgres connection string |
| `Jwt__SigningKey` | Signs this app's own admin login tokens (≥32 chars) |
| `TokenEncryption__Key` | Encrypts LinkedIn tokens at rest |
| `LinkedIn__ClientId` / `LinkedIn__ClientSecret` | From your LinkedIn app |
| `LinkedIn__RedirectUri` | Must exactly match what's registered on the LinkedIn app |

Required to actually sign in as an admin:

| Variable | Purpose |
|---|---|
| `InitialAdmin__Email` / `InitialAdmin__Password` | Seeded as the first admin user on first startup only |

There is deliberately no open self-registration endpoint — the only way an
admin account is created is this seed step (or inserting another `AdminUsers`
row directly). Change the password after first login if you like; there's no
separate first-run wizard for that yet.

A `.env` file in `src/Tisoro.LinkedIn.Api/` is picked up automatically for
local development (loaded before configuration is read). In any other
environment, set real environment variables / platform app settings instead —
the `.env` file is git-ignored and should never hold real values in version
control.

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. `NEXT_PUBLIC_API_BASE_URL` in `.env.local` just
points the browser at the backend — it never holds a secret.

On first run, sign in with the `InitialAdmin__Email` / `InitialAdmin__Password`
you set on the backend.

## 4. LinkedIn app setup

1. Create an app at [developer.linkedin.com](https://www.linkedin.com/developers/apps) under
   the **Tisoro Global** LinkedIn Page (you must be a Page admin).
2. Under **Products**, request the **Community Management API** product.
   LinkedIn reviews this request — it is not instant/self-serve.
3. Under **Auth**, note the **Client ID** and **Client Secret** →
   `LinkedIn__ClientId` / `LinkedIn__ClientSecret`.
4. Add your exact callback URL to **Authorized redirect URLs for your app**,
   e.g. `http://localhost:5253/api/linkedin/callback` for local dev, or your
   real backend's public URL in production. This must byte-for-byte match
   `LinkedIn__RedirectUri`.
5. Requested OAuth scopes (already wired into the connect flow):
   `openid profile w_member_social w_organization_social rw_organization_admin`.
6. In the app, go to **Settings → LinkedIn connection** and click **Connect
   LinkedIn Page**. Sign in with an account that is a **Super Admin** or
   **Content Admin** of the Tisoro Global Page — a personal profile with no
   admin role on the Page cannot be used to post as the organization.
7. If the Page is owned by a LinkedIn **organization/company** (not a
   personal profile), the app may also need to be approved for that
   organization under the organization's own admin settings before posts can
   be created on its behalf.

Until this is connected, scheduled posts will fail with a clear
"No active LinkedIn connection" error (visible on the post and in the
backend logs) rather than silently doing nothing.

## 5. Running tests

```bash
cd backend
dotnet test
```

Unit tests (token encryption, password hashing, LinkedIn post-body shaping)
need nothing extra. The integration tests under
`tests/Tisoro.LinkedIn.Api.Tests/Integration/` boot the real app against a
real Postgres database and need one to exist:

```bash
psql -U postgres -c "CREATE DATABASE tisoro_linkedin_test;"
export INTEGRATION_TEST_DB_CONNECTION="Host=localhost;Port=5432;Database=tisoro_linkedin_test;Username=postgres;Password=postgres"
dotnet test
```

(Defaults to that same connection string if the env var isn't set.) These
tests exercise the real HTTP pipeline: login, JWT auth enforcement, post
CRUD and validation rules, publish-now failure handling, and the engagement
checklist — not mocks.

Frontend:

```bash
cd frontend
npm run build   # typechecks, lints, and builds
```

## How publishing works

1. A post is created as a **Draft** (no `scheduledAt`) or **Scheduled** (with
   one).
2. A background service inside the API (`PostPublishingBackgroundService`)
   polls every `Publishing__PollIntervalSeconds` (default 60s) for Scheduled
   posts whose time has passed, and publishes them — or you can click
   **Publish now** on a Draft/Scheduled post to publish immediately.
3. Publishing uploads any attached media to LinkedIn first (Images / Videos /
   Documents upload APIs), then calls the Posts API
   (`POST /rest/posts`) with the author set to the connected organization.
4. On success the post is marked **Published** with LinkedIn's own post URN.
   On failure it's marked **Failed** with the real error message from
   LinkedIn (or from this app, e.g. a missing connection) — it is **not**
   silently retried; use **Retry** once you've fixed the underlying problem
   (reconnect LinkedIn, fix a rejected caption, etc).

## Security notes

- All secrets (LinkedIn client secret, JWT signing key, token-encryption key,
  DB connection string, admin seed password) are read from environment
  variables only — never hardcoded, never logged, never sent to the
  frontend. See `.env.example` in each of `backend/src/Tisoro.LinkedIn.Api/`
  and `frontend/`.
- LinkedIn access/refresh tokens are encrypted at rest (AES-256-GCM) before
  being stored in Postgres.
- The admin JWT only authenticates to *this* app; it is unrelated to the
  LinkedIn OAuth tokens, which are only ever used server-side.
- `appsettings.json` ships with every secret field blank by design — it is
  safe to commit, and startup fails loudly (not silently) if a required
  secret env var is still unset.
