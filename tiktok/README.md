# TikTok Publishing Console

A standalone, independently runnable project for connecting a TikTok creator/business
account and publishing video or photo content through TikTok's official Content Posting
API. It is one of two sibling platform projects in this repository (`tiktok/` and
`instagram/`); the two share no code, no database, and no configuration.

## A. Project overview

The project is a thin "publishing console" on top of TikTok's official developer APIs:

- **Frontend** (`frontend/`): Next.js 16 (App Router) + TypeScript + Tailwind. Renders the
  UI and exposes a small set of server-only Route Handlers under `/api/proxy/*` that act as
  a secure backend-for-frontend (BFF). The browser never talks to the .NET API or to TikTok
  directly.
- **Backend** (`backend/`): ASP.NET Core 8 Web API (`TikTok.Api`). Owns the OAuth flow,
  token storage/refresh, all calls to TikTok's API, and the Postgres database.
- **Communication**: Browser → Next.js server (Route Handlers) → `TikTok.Api` (header
  `X-Admin-Api-Key`) → `open.tiktokapis.com`. The admin API key and the TikTok client
  secret exist only on servers; neither ever reaches client-side JavaScript.

This is a generic, reusable publishing tool — it is **not** hardcoded to any single
creator or brand.

## B. Requirements analysis

The brief for this project was an Excel workbook (`Tiktok_Final.xlsx`) that turned out, on
inspection, to be a **social-media content/operations playbook** for a specific client
("Tisoro Global") — account profile settings, a day-by-day posting cadence, and
caption/hashtag copy templates — rather than a technical API specification. Per the task's
own instruction to document ambiguity and make a reasonable decision, this project treats
the workbook as the **feature-requirements source**: every content type, account setting,
and workflow it describes was mapped to "does TikTok's official API support this,
automatically or with manual steps" or "this is not possible through any public API."

| Excel requirement | Status | Notes |
| --- | --- | --- |
| Account ID / profile creation (bio, username, avatar, business verification, industry restrictions) | **Read-only via API** | `GET /v2/user/info/` returns these fields. TikTok's public API has **no endpoint to write** bio, avatar, username, business verification, or industry-restriction settings — those stay manual, inside the TikTok app. |
| Shorts/Reels (video) | **Implemented** | `POST /v2/post/publish/video/init/`, polled via `/v2/post/publish/status/fetch/`. |
| Image Posts ("Photo Mode") | **Implemented** | `POST /v2/post/publish/content/init/` with `media_type: PHOTO`, one or more image URLs. |
| Pinned Posts (up to 3) | **Not implemented — no public API** | There is no Content Posting API endpoint to pin a post to a profile. Manual, in-app only. |
| Highlights | **Not implemented — not a real TikTok feature** | The source workbook's TikTok "Highlights" sheet is templated from the Instagram version (it literally says "Highlights to YouTube Playlist Mapping"). TikTok has no Highlights/collections concept at all; this is documented here as a detected copy-paste artifact in the source document, not a feature gap on our side. |
| Stories | **Not implemented — no public publish API** | The workbook's TikTok "Stories" sheet says "Same as Instagram," but TikTok's Content Posting API has no Stories-publishing endpoint. Stories can only be posted manually, in-app. |
| Posting schedule / cadence | **Implemented** | `PublishingJob.ScheduledAt` + a background worker (`PublishingBackgroundWorker`) that publishes due jobs and polls their status. |
| Caption / hashtag content per post | **Implemented** | `Caption` + `Hashtags` fields on every publishing job, concatenated into the TikTok `post_info.description`. |
| TikTok Live | **Explicitly out of scope** | The workbook itself says "Will Not Go Live here — because Live Event cannot be created here." Not implemented, matching the source document. |
| Analytics / insights | **Implemented (own videos only)** | `POST /v2/video/list/` returns view/like/comment/share counts for the connected creator's own videos; snapshotted into `VideoStatsSnapshot`. |

## C. Architecture and folder structure

```
tiktok/
├── frontend/                 Next.js 16 App Router, TypeScript, Tailwind
│   ├── src/app/               Pages: dashboard, connect, compose, jobs, stats, settings
│   ├── src/app/api/proxy/     Server-only Route Handlers that forward to the backend with
│   │                          the admin API key attached; the only thing the browser talks to
│   ├── src/components/        Shared UI (NavBar, StatusBadge)
│   └── src/lib/                server-api.ts (server-side fetch + secret header),
│                               client-api.ts (browser-side fetch wrapper), types.ts
├── backend/                   ASP.NET Core 8 Web API — TikTok.Api
│   ├── Controllers/            AccountsController, PublishingController, StatsController
│   ├── Services/               OAuth/account service, publishing service, stats service,
│   │                           background worker, global exception middleware
│   ├── Clients/                TikTokApiClient — the only code that calls open.tiktokapis.com
│   ├── Security/               PKCE generator, OAuth state store, admin API key auth handler,
│   │                           Data Protection–based token encryption
│   ├── Entities/ + Data/       EF Core entities, TikTokDbContext, Data/Migrations
│   ├── Models/TikTok/          Wire DTOs matching TikTok's JSON exactly
│   ├── Models/Dtos/            This API's own request/response contracts
│   └── TikTok.Api.Tests/       xUnit tests
├── .env.example                Aggregated reference of every variable used by both halves
└── README.md                   This file
```

## D. Prerequisites

- Node.js 20+ and npm 10+ (built and tested with Node 22.22 / npm 10.9)
- .NET SDK 8.0
- PostgreSQL 16 (or any supported Postgres 13+)
- The `dotnet-ef` CLI tool: `dotnet tool install --global dotnet-ef`

## E. TikTok developer app setup

1. Create a developer account at [developers.tiktok.com](https://developers.tiktok.com/).
2. Create an app, then add the **Login Kit** product and the **Content Posting API**
   product.
3. Under Login Kit, register the redirect URI exactly as configured in
   `TikTok:RedirectUri` (e.g. `https://your-backend-domain/api/accounts/callback`).
4. Request scopes: `user.info.basic`, `user.info.profile`, `user.info.stats`,
   `video.publish`, `video.upload`, `video.list`. Scopes beyond basic user info require
   pre-approval inside your app's TikTok developer configuration before they can be
   requested at runtime.
5. **Audit status matters a lot here.** Per TikTok's own Content Posting API
   documentation: *all content posted by an unaudited client is restricted to private
   (`SELF_ONLY`) visibility*, regardless of what visibility you request. To publish
   publicly with `DIRECT_POST`, the app must pass TikTok's audit of compliance with their
   Terms of Service. Add the account(s) you'll test with as **sandbox target users** while
   unaudited.
6. Add target/test users under the app's sandbox settings so you can complete the OAuth
   flow during development before audit approval.
7. Official docs: [Login Kit overview](https://developers.tiktok.com/docs/en/login-kit-overview),
   [Content Posting API — Get Started](https://developers.tiktok.com/docs/en/content-posting-api-get-started),
   [Direct Post reference](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post),
   [Photo Post reference](https://developers.tiktok.com/docs/en/content-posting-api-reference-photo-post).

## F. Environment configuration

### Backend (`backend/appsettings.json`, overridden by `dotnet user-secrets` locally or
real environment variables / a secret manager in production — **never** put real secrets
in `appsettings.json` or `appsettings.Development.json`)

| Key | Secret? | Purpose |
| --- | --- | --- |
| `ConnectionStrings:DefaultConnection` | Yes | Postgres connection string for `tiktok_db`. |
| `TikTok:ClientKey` | Yes | TikTok app's client key. |
| `TikTok:ClientSecret` | Yes | TikTok app's client secret. |
| `TikTok:RedirectUri` | No | Must exactly match the URI registered with TikTok. |
| `TikTok:AuthorizeUrl` | No | `https://www.tiktok.com/v2/auth/authorize/` |
| `TikTok:TokenUrl` | No | `https://open.tiktokapis.com/v2/oauth/token/` |
| `TikTok:ApiBaseUrl` | No | `https://open.tiktokapis.com` |
| `TikTok:Scopes` | No | Comma-separated scope list requested at connect time. |
| `AppSecurity:AdminApiKey` | Yes | Shared secret the frontend's server must send as `X-Admin-Api-Key` on every call. Generate a long random value per environment. |
| `AppSecurity:TokenEncryptionPurpose` | No | Data Protection "purpose" string used to scope token encryption. |
| `Cors:AllowedOrigins` | No | Array of allowed frontend origins; also used to build the OAuth callback redirect target. |

Set secrets locally with:

```bash
cd backend
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=tiktok_db;Username=tiktok_app;Password=<your-password>"
dotnet user-secrets set "TikTok:ClientKey" "<from TikTok developer portal>"
dotnet user-secrets set "TikTok:ClientSecret" "<from TikTok developer portal>"
dotnet user-secrets set "AppSecurity:AdminApiKey" "<generate a long random string>"
```

In production, supply the same keys as environment variables using the `Section__Key`
convention (e.g. `TikTok__ClientSecret`), or via your platform's secret manager
(Azure Key Vault, AWS Secrets Manager, etc.) — see Section M.

### Frontend (`frontend/.env.example` → copy to `frontend/.env.local`)

| Key | Secret? | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_NAME` | No | Display name only; safe to bundle client-side. |
| `API_BASE_URL` | No (but server-only) | Base URL of the `TikTok.Api` backend. Read only inside Route Handlers — never bundled to the browser because it lacks the `NEXT_PUBLIC_` prefix. |
| `ADMIN_API_KEY` | **Yes** | Must equal the backend's `AppSecurity:AdminApiKey`. Read only inside Route Handlers, attached server-side to every backend call. Never exposed to the browser. |

## G. Installation and startup

### Database

```bash
sudo -u postgres psql -c "CREATE DATABASE tiktok_db;"
sudo -u postgres psql -c "CREATE USER tiktok_app WITH PASSWORD '<choose-a-password>';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tiktok_db TO tiktok_app;"
sudo -u postgres psql -d tiktok_db -c "GRANT ALL ON SCHEMA public TO tiktok_app;"
```

### Backend (default port **5080**)

```bash
cd backend
dotnet restore
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=tiktok_db;Username=tiktok_app;Password=<your-password>"
dotnet user-secrets set "TikTok:ClientKey" "<...>"
dotnet user-secrets set "TikTok:ClientSecret" "<...>"
dotnet user-secrets set "AppSecurity:AdminApiKey" "<...>"
dotnet ef database update --project TikTok.Api.csproj --startup-project TikTok.Api.csproj
ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://127.0.0.1:5080 dotnet run --project TikTok.Api.csproj
```

Health check: `curl http://127.0.0.1:5080/health`

### Frontend (default port **3100**)

```bash
cd frontend
cp .env.example .env.local   # then fill in API_BASE_URL and ADMIN_API_KEY
npm install
npm run dev
```

Open `http://localhost:3100`. To change ports: pass `-p <port>` to the `dev`/`start`
scripts in `package.json`, and update `TikTok:RedirectUri` / `Cors:AllowedOrigins`
accordingly.

### Running the test suite

```bash
cd backend
dotnet test
```

## H. Feature-by-feature implementation guide

| Feature | Frontend | Backend endpoint | External API | Required scope | Data | Config needed |
| --- | --- | --- | --- | --- | --- | --- |
| Connect account | `/connect` | `GET /api/accounts/connect`, `GET /api/accounts/callback` | `/v2/auth/authorize/`, `/v2/oauth/token/` | all requested scopes | `ConnectedAccount` row created/updated | `TikTok:*`, redirect URI registered with TikTok |
| Disconnect account | `/connect` | `DELETE /api/accounts/{id}` | none | — | marks account inactive, clears tokens | — |
| Publish video | `/compose` | `POST /api/publishing/jobs` → background worker → `/v2/post/publish/video/init/` | Content Posting API | `video.publish` or `video.upload` | `PublishingJob` + `MediaAsset` rows | source video must be at a public HTTPS URL |
| Publish photo post | `/compose` | same as above, `ContentType=PhotoPost` | `/v2/post/publish/content/init/` | `video.publish` or `video.upload` | same | source images at public HTTPS URLs |
| Job status / retry | `/jobs` | `GET /api/publishing/jobs`, `POST /api/publishing/jobs/{id}/retry` | `/v2/post/publish/status/fetch/` | — | updates `PublishingJob.Status` | — |
| Stats | `/stats` | `GET /api/stats/accounts/{id}/videos` | `/v2/video/list/` | `user.info.stats` or `video.list` | writes `VideoStatsSnapshot` rows | — |
| Health/config check | `/settings` | `GET /health` (anonymous) | — | — | — | — |

Testing without live TikTok credentials: run `dotnet test` (mocks every TikTok HTTP call),
or start the backend with placeholder credentials and exercise `/health`,
`/api/accounts` (empty list), and `/api/accounts/connect` (builds a real, well-formed
authorization URL even though following it will fail against TikTok without a real app).

## I. Automatic vs. manual workflows

| Workflow | Automation status | Requirements |
| --- | --- | --- |
| Account connection | Semi-automatic | User completes TikTok's hosted consent screen; requires the app to list the user as a sandbox target (pre-audit) or to have passed audit (post-audit) |
| Video / photo publish, `DIRECT_POST` | Automatic once connected, but **restricted to private visibility pre-audit** | TikTok forces `SELF_ONLY` visibility for any unaudited client regardless of the requested `privacy_level` |
| Video / photo publish, `MEDIA_UPLOAD` | Automatic send, **manual finish** | Content lands in the creator's TikTok inbox; the creator must open the TikTok app and tap "Post" themselves |
| Token refresh | Fully automatic | Refresh token valid 365 days from issuance; access token refreshed transparently whenever it is within 2 minutes of expiry |
| Publish status polling | Fully automatic | Background worker polls every 30 seconds while a job is `Processing` |
| Stats retrieval | Automatic on request | Only reports the connected creator's own videos; no access to other accounts' analytics |
| Profile bio / avatar / username edits | **Manual only** | No public API; must be changed inside the TikTok app |
| Pinned posts | **Manual only** | No public API |
| Stories | **Manual only** | No public publish API |
| Highlights | **Not applicable** | TikTok has no such feature |
| App audit (to unlock public `DIRECT_POST`) | **Manual / external** | TikTok review process; see Section E |

## J. Limitations and unsupported features

- **Profile editing** (bio, avatar, username, business verification, industry
  restriction flags): read-only via `/v2/user/info/`; TikTok's public API has no write
  endpoint for any of these. Change them in the TikTok app.
- **Pinned posts**: no public API. Manual only.
- **Highlights**: not a real TikTok feature (see Section B's note on the source
  document). Not implemented, and no table exists for it.
- **Stories**: no public Content Posting API endpoint for Stories. Not implemented.
- **TikTok Live**: out of scope, matching the source requirements document, and also not
  something TikTok's public API supports for arbitrary third-party publishing.
- **Public visibility before audit**: `DIRECT_POST` content from an unaudited app is
  forced to `SELF_ONLY` by TikTok itself, not by this codebase.
- **Comment moderation / custom hidden-word lists**: not implemented for TikTok — no
  stable public endpoint for programmatic comment moderation was identified at the time
  of writing. (The Instagram sibling project implements an equivalent feature on top of
  the Instagram Comments API, since that endpoint does exist there.)
- **Live credential testing**: this environment has no real TikTok developer app
  credentials and no outbound path to interactively complete TikTok's OAuth consent
  screen. Everything that can be verified without live credentials was verified (see
  Section N); the OAuth code-exchange, token-refresh, and publish-status paths are
  implemented against TikTok's documented contracts and unit-tested against mocked HTTP
  responses, but have **not** been exercised against TikTok's live servers.
- **Frontend dependency note**: `tailwindcss@3` (and its `postcss-nested` /
  `postcss-selector-parser` dependencies) carries an open moderate-severity, build-time-only
  CPU-exhaustion advisory with no fix released on the 3.x line; the fix requires Tailwind
  v4, a breaking rewrite of the config format, which was out of scope for this task. The
  issue only affects the machine running `npm run build`/`dev`, not deployed runtime
  traffic. `next`, `react`, `postcss`, and `eslint` are all pinned to versions with no open
  advisories at the time of writing.

## K. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `401 Unauthorized` from any `/api/proxy/*` route | `ADMIN_API_KEY` in the frontend's env doesn't match `AppSecurity:AdminApiKey` in the backend | Make the two values identical |
| OAuth callback redirects with `status=error&reason=...` | Bad `state`/PKCE verifier (expired after 10 minutes, or already used), or a TikTok-reported `error` query param | Restart the connect flow from `/connect`; check the reason string |
| `invalid_client` / `invalid_grant` from TikTok's token endpoint | Wrong `ClientKey`/`ClientSecret`, or redirect URI mismatch | Confirm `TikTok:RedirectUri` exactly matches what's registered in the TikTok developer portal |
| Publish job stuck in `Processing` forever | TikTok's moderation can take "a few hours" in rare cases per their docs; otherwise check backend logs for polling errors | Wait, or inspect `PublishingJob.ErrorMessage` after it resolves |
| Publish job `Failed` with a `picture_size_check_failed`-style message | TikTok rejected the specific media; see `fail_reason` in the job's error message | Fix the source media and retry via `/jobs` |
| CORS error in the browser console | Frontend origin not listed in `Cors:AllowedOrigins` | Add it and restart the backend |
| `dotnet ef` commands fail to find the connection string | Running without `ASPNETCORE_ENVIRONMENT=Development`, so user secrets aren't loaded | Export `ASPNETCORE_ENVIRONMENT=Development` before `dotnet ef ...` |
| `EADDRINUSE` on port 5080/3100 | A previous dev server instance is still running | Find and stop it (`ps aux | grep next-server` / `ps aux | grep TikTok.Api.dll`) before restarting |

## L. Testing

- **Backend unit tests** (`cd backend && dotnet test`): PKCE generation against TikTok's
  hex-SHA-256 spec, OAuth state single-use semantics, Data Protection token encryption
  round-trip, the TikTok API client against a mocked `HttpMessageHandler` (success, error,
  `DIRECT_POST`-vs-inbox status shapes, failure reasons), and request validation.
- **Frontend checks**: `npm run lint` (ESLint 9 flat config, `eslint-config-next`) and
  `npm run build` (TypeScript + Next.js production build).
- **OAuth / live API testing**: requires a real TikTok developer app, at least one sandbox
  target user (pre-audit) or audited app (for public posts), and manually walking through
  `/connect` in a browser. This could not be performed in this environment — see Section J.

## M. Production deployment

- Run the backend behind HTTPS only; set `TikTok:RedirectUri` and `Cors:AllowedOrigins` to
  the real production hostnames.
- Store `TikTok:ClientSecret` and `AppSecurity:AdminApiKey` in a real secret manager
  (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault, or platform-native secrets), not
  in `appsettings.json`.
- **Data Protection key ring**: by default, ASP.NET Core's Data Protection keys (used to
  encrypt tokens at rest) are stored on local disk. In any multi-instance or ephemeral
  deployment, configure a persistent, shared key ring (e.g.
  `PersistKeysToAzureBlobStorage`, a shared file share, or Redis) — otherwise tokens
  encrypted by one instance cannot be decrypted by another, or after a redeploy.
- Apply EF Core migrations as an explicit deployment step
  (`dotnet ef database update`), not automatically on application startup.
- Deploy the frontend (`next build && next start`, or to a Node-compatible host) with
  `API_BASE_URL` pointing at the backend's internal/private address if possible, and never
  set `ADMIN_API_KEY` as a `NEXT_PUBLIC_` variable.
- Point the TikTok app's registered redirect URI at the production backend's
  `/api/accounts/callback`.
- Monitor the background worker's logs; a stuck `Processing` job past a few hours is worth
  alerting on.

## N. PostgreSQL database

**Schema** (created by the `InitialCreate` migration in `backend/Data/Migrations/`):

- `ConnectedAccounts` — one row per linked TikTok account. Unique index on `OpenId`.
  Tokens are stored encrypted (`EncryptedAccessToken` / `EncryptedRefreshToken`) via
  ASP.NET Core Data Protection, never in plaintext.
- `PublishingJobs` — one row per publish attempt, FK → `ConnectedAccounts` (cascade
  delete). Indexed on `(Status, ScheduledAt)` for the background worker's polling query.
- `MediaAssets` — one row per media item in a job (supports multi-image photo posts), FK →
  `PublishingJobs` (cascade delete), unique on `(PublishingJobId, Order)`.
- `VideoStatsSnapshots` — point-in-time snapshots of a video's view/like/comment/share
  counts, FK → `ConnectedAccounts` (cascade delete).

**Connection configuration**: a single key, `ConnectionStrings:DefaultConnection`, read by
`Npgsql.EntityFrameworkCore.PostgreSQL` in `Program.cs`. Set it via `dotnet user-secrets`
locally (Section F) or `ConnectionStrings__DefaultConnection` as a real environment
variable / secret-manager entry in any deployed environment.

**Local setup**:

```bash
sudo -u postgres psql -c "CREATE DATABASE tiktok_db;"
sudo -u postgres psql -c "CREATE USER tiktok_app WITH PASSWORD '<password>';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tiktok_db TO tiktok_app;"
sudo -u postgres psql -d tiktok_db -c "GRANT ALL ON SCHEMA public TO tiktok_app;"
```

**Migration commands**:

```bash
cd backend
# create a new migration after changing an entity or TikTokDbContext:
ASPNETCORE_ENVIRONMENT=Development dotnet ef migrations add <Name> --project TikTok.Api.csproj --startup-project TikTok.Api.csproj
# apply pending migrations (fresh database or upgrade):
ASPNETCORE_ENVIRONMENT=Development dotnet ef database update --project TikTok.Api.csproj --startup-project TikTok.Api.csproj
```

**Troubleshooting**: `Npgsql.NpgsqlException: Connection refused` means Postgres isn't
running or the host/port is wrong; `password authentication failed` means the connection
string's credentials don't match the role created above; `dotnet ef` failing to resolve
the connection string almost always means `ASPNETCORE_ENVIRONMENT=Development` wasn't set
(user secrets only load in that environment).

**Backup and restore**:

```bash
# backup
pg_dump -h localhost -U tiktok_app -d tiktok_db -Fc -f tiktok_db.bak

# restore into a fresh database
createdb -h localhost -U tiktok_app tiktok_db_restored
pg_restore -h localhost -U tiktok_app -d tiktok_db_restored tiktok_db.bak
```

**Production considerations**: enable SSL (`SSL Mode=Require` in the connection string),
use a managed Postgres instance with automated backups, run migrations as an explicit
release step rather than at application startup, and keep `tiktok_db` on a separate
instance/credential set from the sibling `instagram_db` — this project never shares a
database or a `DbContext` with the Instagram project.

## O. Current implementation status

**Done and verified in this environment:**
- [x] Backend builds clean (`dotnet build`, 0 errors/warnings)
- [x] EF Core migration generated and applied to a real local `tiktok_db` (tables:
  `ConnectedAccounts`, `PublishingJobs`, `MediaAssets`, `VideoStatsSnapshots`)
- [x] 17 xUnit tests, all passing
- [x] Backend boots and serves `GET /health` → 200; `GET /api/accounts` → 401 without the
  admin key, 200 with it
- [x] Frontend installs, lints, and builds clean with Next.js 16 / React 18 / TypeScript
- [x] Full request chain verified live: browser → Next.js proxy route (holding
  `ADMIN_API_KEY` server-side) → `TikTok.Api` → Postgres, including a real,
  correctly-shaped TikTok OAuth authorization URL with PKCE
- [x] OAuth authorize URL construction, PKCE (hex-SHA-256 per TikTok's spec, not standard
  base64url), state CSRF protection, token encryption at rest
- [x] Video and photo-post publish flow coded against TikTok's documented Content Posting
  API, including the `DIRECT_POST` vs `MEDIA_UPLOAD` distinction and status polling
- [x] Stats retrieval and snapshotting

**Pending external/manual setup (cannot be completed from this environment):**
- [ ] Registering a real TikTok developer app, Login Kit + Content Posting API products,
  and sandbox target users
- [ ] Completing a live OAuth consent flow end-to-end against TikTok's servers
- [ ] TikTok app audit, required to unlock public (non-`SELF_ONLY`) `DIRECT_POST`
  publishing
- [ ] Observing a real publish → status-poll → `PUBLISH_COMPLETE` cycle against TikTok's
  production API

**Not implemented — platform/API limitations (see Section J for detail):**
- [ ] Profile bio/avatar/username editing
- [ ] Pinned posts
- [ ] Stories
- [ ] Highlights (not a real TikTok feature)
- [ ] TikTok Live
- [ ] Programmatic comment moderation
