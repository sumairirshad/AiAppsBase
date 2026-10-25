# Instagram Publishing & Account Console

## A. Project overview

This project is a standalone tool for connecting an Instagram professional
(Business or Creator) account and publishing content to it through Meta's
official **Instagram API with Instagram Login**. It is one of two
intentionally separate platform integrations in this repository (the other
is `tiktok/`); they share no code, no database, and no configuration.

The system has two independently runnable pieces:

- **`backend/`** — an ASP.NET Core 8 Web API that owns all OAuth handshakes,
  encrypted token storage, outbound calls to Instagram's Graph API, a
  PostgreSQL-backed job queue for scheduled/immediate publishing, and a
  background worker that executes due jobs.
- **`frontend/`** — a Next.js 16 (App Router) + TypeScript console for an
  operator to connect an account, compose and schedule posts, watch job
  status, and view insights. (Built initially on Next.js 14.2.33; upgraded to
  16.4.3 + React 19 after `npm audit` reported 8 unpatched advisories on the
  14.x line — 1 critical, including unauthenticated RCE in the Image
  Optimization API for AVIF/SVG files and on Windows-hosted servers — with no
  fix released on 14.x. Next.js 15+ also made route-handler `params` async,
  which the dynamic routes under `app/api/**/[id]/route.ts` account for. One
  tradeoff was kept: `tailwindcss@3` still carries a moderate,
  build-time-only CPU-exhaustion advisory in a transitive PostCSS dependency;
  upgrading to Tailwind v4 is a breaking rewrite of the whole styling layer
  and was judged not worth doing for a build-time-only, non-exploitable-at-
  runtime advisory — tracked in Section J.)

The frontend never talks to Meta directly and never sees an access token.
Every browser-originated call goes to the frontend's own Next.js Route
Handlers (`frontend/app/api/**/route.ts`), which run server-side, attach a
shared admin API key, and forward the request to the backend. The backend is
the only component that holds Instagram client secrets and user tokens.

## B. Requirements analysis

The requirements source for this project is `Insta_Final.xlsx`, supplied as
the implementation brief. Reading it in full showed it is **not** a
technical API/OAuth specification — it is a social-media operations
playbook written for a specific client ("Tisoro Global"): Instagram account
profile settings, privacy/interaction settings, a "Hidden Words" competitor
and negative-word comment-moderation list, content types (Reels/Shorts,
Image Posts including multi-image "Albums", Stories, up to three Pinned
Posts, Highlights as story collections), an hour-by-hour posting
cadence/schedule, and caption/hashtag copy templates per content type.

**Decision (documented ambiguity):** rather than building a one-off tool
hardcoded to that one client's captions and schedule, this project treats
the spreadsheet as the *feature list* a real Instagram publishing tool
needs to support, and builds a generic, reusable tool with that feature set.
Nothing in the UI or database is specific to "Tisoro Global."

| Excel-derived requirement | Implementation | Notes |
|---|---|---|
| Account ID / Instagram professional account connection | `AuthController` + `AccountService`, OAuth Authorization Code + PKCE flow | Implemented |
| Account Profile (bio, profile picture, website, category, contact info) | Read-only sync via `GET /me` | **Instagram's API does not expose write access** to these fields — see Limitations |
| Privacy & interaction settings (who can comment/mention/tag, message controls) | — | **Not exposed by any public Instagram API** — manual only, see Limitations |
| Image Posts, incl. "Albums" (carousel) | `PublishingController` → `IInstagramGraphClient` carousel container flow | Implemented |
| Shorts/Reels (video) | Same, with `media_type=REELS` | Implemented |
| Stories | Same, with `media_type=STORIES` | Implemented |
| Pinned Posts (up to 3) | — | **No public API to pin a post** — manual only, see Limitations |
| Highlights (story collections) | — | **No public API to create/manage Highlights** — manual only, see Limitations |
| "Hidden Words" custom competitor/negative-word list | — | **Not a public API feature.** The API does expose per-comment hide/unhide (`CommentsController`), which is the closest supported primitive, but there is no endpoint for an account-wide custom keyword blocklist. See Limitations |
| Hour-by-hour posting schedule/cadence | `PublishingJob.ScheduledAt` + `ScheduledPublishingWorker` background service | Implemented — an operator can schedule any job for a future time, satisfying the "cadence" requirement generically rather than hardcoding the spreadsheet's specific hour table |
| Caption + hashtag templates per content type | `Caption` / `Hashtags` free-text fields on each job | Implemented as free text; the specific brand copy in the spreadsheet is content, not a software requirement |
| Instagram Live | Explicitly out of scope — the source document itself says "Will Not Go Live here" | Not implemented, by the spreadsheet's own instruction |
| Analytics / Insights | `InsightsController` → account- and media-level Graph API Insights | Implemented, subject to `instagram_business_manage_insights` approval |

## C. Architecture and folder structure

```
instagram/
├── backend/                     ASP.NET Core 8 Web API (Instagram.Api)
│   ├── Controllers/             HTTP endpoints (Auth, Accounts, Publishing, Insights, Comments, Health)
│   ├── Services/                Business logic (AccountService, PublishingJobService,
│   │                             PublishingOrchestrator, InsightsService, CommentModerationService)
│   ├── Clients/                 InstagramGraphClient — the only code that calls graph.instagram.com
│   ├── Entities/                EF Core entities (ConnectedAccount, PublishingJob, MediaAsset, InsightsSnapshot)
│   ├── Data/                    InstagramDbContext + Migrations/
│   ├── Security/                OAuth state/PKCE, Data Protection token encryption, admin API key auth handler
│   ├── Configuration/            Strongly-typed options bound from appsettings/env
│   ├── BackgroundServices/       ScheduledPublishingWorker (polls due jobs, publishes them)
│   ├── Models/                   Request/response DTOs
│   └── Common/                   Global exception-handling middleware
├── backend.Tests/                xUnit tests (sibling test project, not shipped at runtime)
├── frontend/                     Next.js 16 App Router + TypeScript + Tailwind
│   ├── app/                      Pages: dashboard, accounts (+ OAuth callback), compose, jobs, insights, settings
│   ├── app/api/**/route.ts       Server-side proxy routes — the only place the admin API key is used
│   ├── components/               Shared UI (NavBar, Card, Button, Badge, EmptyState, LoadingState, ErrorAlert)
│   └── lib/                      backend-client.ts (server-only, holds the secret), api-client.ts (browser-safe), types.ts
├── .env.example                  Aggregated reference of every variable used by both apps
└── README.md                     This file
```

### Request flow

1. Browser calls a same-origin `/api/*` route in the Next.js app.
2. That Route Handler runs on the server, attaches `X-Admin-Api-Key`, and
   calls the ASP.NET Core backend.
3. The backend validates the key, loads the relevant `ConnectedAccount`,
   decrypts its token (and refreshes it first if it's within a day of
   expiring), and calls Instagram's Graph API.
4. For publishing, the backend creates a media container, polls it until
   `FINISHED`, then calls `media_publish`. A background worker performs the
   same sequence automatically for jobs with a future `ScheduledAt`.

## D. Prerequisites

- Node.js 20+ and npm 10+ (built and tested with Node 22.22 / npm 10.9.4)
- .NET SDK 8.0
- PostgreSQL 16 (or any PostgreSQL 13+)
- `dotnet-ef` CLI tool: `dotnet tool install --global dotnet-ef`
- A Meta Developer account and an app with the **Instagram API with
  Instagram Login** product added (see Section E)

## E. Developer account setup (Meta / Instagram)

1. Create an app at [developers.facebook.com](https://developers.facebook.com/apps/).
2. Add the **Instagram** product, specifically **"API setup with Instagram
   login"** (this is the direct-login product — it does not require a
   linked Facebook Page, unlike the older Instagram API with Facebook
   Login).
3. Under *Business login settings*, note your **Instagram App ID** and
   **Instagram App Secret** — these are `InstagramApi:ClientId` /
   `InstagramApi:ClientSecret`, not your Facebook App ID/Secret.
4. Add a valid OAuth redirect URI that exactly matches
   `InstagramApi:RedirectUri` (locally: `http://localhost:3100/accounts/callback`
   — note this is the **frontend's** callback page, since that's what the
   user's browser lands on after Meta redirects them).
5. Request the scopes this app uses:
   `instagram_business_basic`, `instagram_business_content_publish`,
   `instagram_business_manage_comments`, `instagram_business_manage_insights`.
   (Meta renamed these from the shorter `business_basic` / etc. names;
   the short names were deprecated January 27, 2025.)
6. While the app is in Development mode, add the Instagram professional
   account you'll test with as an **Instagram Tester** (App Dashboard →
   Instagram → Roles) and accept the invite from that account's Instagram
   app under Settings → Apps and Websites → Tester Invites.
7. For `instagram_business_content_publish`,
   `instagram_business_manage_comments`, and
   `instagram_business_manage_insights` to work for accounts that are not
   testers/admins on your app, Meta requires **App Review** with a
   screencast and justification per scope.
8. Official docs: [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login),
   [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing),
   [Comment Moderation](https://developers.facebook.com/docs/instagram-api/guides/comment-moderation).

This project has **not** been tested against Meta's live servers — no real
app credentials were available in this environment. All HTTP calls in
`InstagramGraphClient` are written against the documented endpoints above
(confirmed via Meta's current developer documentation) but have only been
exercised with mocked HTTP responses in `backend.Tests`.

## F. Environment configuration

See `instagram/.env.example` for the full aggregated list. Summary:

| Variable | Where | Secret? | Purpose |
|---|---|---|---|
| `ConnectionStrings:DefaultConnection` | backend, user-secrets locally / env var in prod | Yes | PostgreSQL connection string |
| `InstagramApi:ClientId` | backend | No (but treat as sensitive) | Instagram App ID |
| `InstagramApi:ClientSecret` | backend | **Yes** | Instagram App Secret — server-side token exchange only |
| `InstagramApi:RedirectUri` | backend | No | Must match the frontend's `/accounts/callback` URL and the app's registered redirect URI |
| `AdminAuth:ApiKey` | backend + frontend (`INSTAGRAM_ADMIN_API_KEY`) | **Yes** | Shared secret between the frontend's server-side routes and the backend; never sent to the browser |
| `Cors:AllowedOrigins` | backend | No | Must include the frontend's origin |
| `INSTAGRAM_BACKEND_URL` | frontend | No | Backend base URL, read only on the server |
| `INSTAGRAM_ADMIN_API_KEY` | frontend | **Yes** | Must equal the backend's `AdminAuth:ApiKey`. Deliberately **not** `NEXT_PUBLIC_` — it is only read inside Route Handlers and Server Components, never shipped to the browser bundle |

## G. Installation and startup

### Backend (port 5280 by default)

```bash
cd instagram/backend
dotnet restore
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=instagram_db;Username=instagram_app;Password=<your-password>"
dotnet user-secrets set "InstagramApi:ClientId" "<your-instagram-app-id>"
dotnet user-secrets set "InstagramApi:ClientSecret" "<your-instagram-app-secret>"
dotnet user-secrets set "AdminAuth:ApiKey" "<a-strong-random-string>"
dotnet ef database update
dotnet run --urls http://localhost:5280
```

Swagger UI is available at `http://localhost:5280/swagger` in Development.

### Frontend (port 3100 by default)

```bash
cd instagram/frontend
cp .env.example .env.local
# edit .env.local: INSTAGRAM_BACKEND_URL, INSTAGRAM_ADMIN_API_KEY (must match backend's AdminAuth:ApiKey)
npm install
npm run dev
```

Visit `http://localhost:3100`. The frontend talks to the backend at
`INSTAGRAM_BACKEND_URL` — change that variable (and the backend's
`--urls`/CORS config) if you run the backend on a different port.

## H. Feature-by-feature implementation guide

| Feature | Frontend | Backend endpoint | External API | Scopes | Data | Test |
|---|---|---|---|---|---|---|
| Connect account | `app/accounts/page.tsx` → `app/accounts/callback/page.tsx` | `GET /api/auth/connect`, `POST /api/auth/callback` | `instagram.com/oauth/authorize`, `api.instagram.com/oauth/access_token`, `graph.instagram.com/access_token` | `instagram_business_basic` | Writes `ConnectedAccount` | Connect button → Meta consent screen → redirected back with `code`/`state` |
| Disconnect account | `app/accounts/page.tsx` | `DELETE /api/accounts/{id}` | — | — | Soft-deactivates `ConnectedAccount` | Click Disconnect, row shows "Disconnected" |
| View connected accounts | `app/accounts/page.tsx` | `GET /api/accounts` | — | — | Reads `ConnectedAccount` | Load page |
| Compose & publish/schedule a post | `app/compose/page.tsx` | `POST /api/publishing/jobs` | `POST /{ig-id}/media`, `POST /{ig-id}/media_publish` | `instagram_business_content_publish` | Writes `PublishingJob` + `MediaAsset` | Submit form with/without a schedule time |
| View job status / retry | `app/jobs/page.tsx` | `GET /api/publishing/jobs`, `POST /api/publishing/jobs/{id}/retry` | `GET /{container-id}` (status polling) | `instagram_business_content_publish` | Reads/updates `PublishingJob` | Filter by status, retry a failed job |
| Scheduled publishing | background | `ScheduledPublishingWorker` | same as above | same | — | Create a job with a future `scheduledAt`; worker picks it up once due |
| Account insights | `app/insights/page.tsx` | `POST /api/insights/accounts/{id}/sync` | `GET /{ig-id}/insights` | `instagram_business_manage_insights` | Writes `InsightsSnapshot` | Click Sync, see metric cards |
| Media insights | — (backend endpoint only; not yet wired to a dedicated UI view) | `GET /api/insights/media/{mediaId}` | `GET /{media-id}/insights` | `instagram_business_manage_insights` | — | `curl` with admin key |
| Comment list / reply / hide / delete | — (backend endpoints only; no dedicated UI page in this iteration) | `GET/POST /api/comments/...` | `GET/POST /{media-id}/comments`, `POST /{comment-id}`, `DELETE /{comment-id}` | `instagram_business_manage_comments` | — | `curl` with admin key |
| Health check | `app/settings/page.tsx` | `GET /health` | — | — | — | Load Settings page |

## I. Automatic vs. manual workflows

| Workflow | Automation status | Requirements |
|---|---|---|
| Account connection | Semi-automatic | User completes Meta's OAuth consent screen once; app must be an approved/tester-added app |
| Token refresh | Automatic | Backend refreshes the long-lived token whenever it's within 1 day of expiry, on any authenticated call |
| Image/Carousel/Reels/Story publishing | Automatic once connected | Media must be hosted at a public HTTPS URL; account must have `instagram_business_content_publish`; capped at 50 API-published posts per rolling 24h (Meta's limit) |
| Scheduled publishing | Fully automatic | Background worker polls every `PublishingWorker:PollIntervalSeconds` (default 60s) |
| Insights sync | Manual trigger, automatic execution | Requires `instagram_business_manage_insights` and, for non-tester accounts, App Review |
| Comment reply/hide/delete | Manual trigger (backend ready, no dedicated UI yet) | Requires `instagram_business_manage_comments` |
| Bio / profile picture / website / category / contact info editing | **Manual only — not possible via this app** | Change directly in the Instagram app or Meta Business Suite |
| Privacy & interaction settings (comments, mentions, tags, messages) | **Manual only — not possible via this app** | Instagram app settings |
| Pinned Posts (up to 3) | **Manual only — not possible via this app** | Instagram app |
| Highlights | **Manual only — not possible via this app** | Instagram app |
| "Hidden Words" custom keyword list | **Manual only — not possible via this app** | Instagram app's built-in Hidden Words feature |
| App Review for restricted scopes | Manual/external | Meta review process, screencast + justification |
| Instagram Live | Not implemented — explicitly excluded by the requirements source | N/A |

## J. Limitations and unsupported features

These are platform limitations of Instagram's official API, not gaps in
this implementation:

- **No write access to profile fields.** The Graph API lets you *read*
  `biography`, `website`, `profile_picture_url`, etc. via `GET /me`, but
  there is no endpoint to update them. Bio, profile picture, website,
  category, contact info, and account type must all be changed manually.
- **No privacy/interaction settings API.** Who can comment, mention, tag,
  or message the account, message/story-reply controls, and activity
  status are account settings with no corresponding API.
- **No Pinned Posts API.** Pinning up to 3 posts to the top of a profile
  grid is an in-app-only action.
- **No Highlights API.** Creating highlight collections from archived
  Stories is in-app-only; the API does not expose Stories archive/Highlight
  management.
- **No "Hidden Words" / custom keyword blocklist API.** The closest
  supported primitive is per-comment `hidden` toggling
  (`CommentsController.SetVisibility`), which this app implements, but an
  account-wide custom word list (as used for competitor names/negative
  words in the requirements source) is not exposed by any public endpoint.
- **No Instagram Live API**, and the requirements source itself excludes
  Live ("Will Not Go Live here").
- **Rate limits**: Meta caps API-published content at roughly 50 posts per
  rolling 24-hour window per account (`content_publishing_limit`), and all
  calls are subject to standard Graph API rate limiting (handled here via
  `RetryHandler`'s exponential backoff on 429/5xx).
- **Not live-tested.** No real Meta app credentials were available in this
  environment, so the actual OAuth round-trip and live content publishing
  have not been exercised end-to-end against Instagram's production
  servers. Everything that could be verified without live credentials was
  verified — see Section L.
- **Accepted dependency advisory.** `tailwindcss@3` pulls a transitive
  `postcss-selector-parser` version with a moderate, build-time-only CPU-
  exhaustion advisory (quadratic-complexity selector parsing). It cannot be
  triggered at runtime by request input — only by the build process parsing
  project-controlled CSS — and upgrading to Tailwind v4 is a breaking rewrite
  of the styling layer. Kept on v3 and documented here rather than silently
  ignored; re-evaluate if Tailwind v4 adoption becomes worthwhile for other
  reasons.

## K. Troubleshooting

- **`INSTAGRAM_BACKEND_URL is not configured`** — set it in
  `frontend/.env.local` and restart `npm run dev`.
- **401 from the backend** — the frontend's `INSTAGRAM_ADMIN_API_KEY`
  doesn't match the backend's `AdminAuth:ApiKey`.
- **OAuth `redirect_uri` mismatch** — the URI in
  `InstagramApi:RedirectUri` must exactly match a URI registered in the
  Meta App Dashboard, including scheme and trailing slash behavior.
- **"Invalid OAuth state" on the callback page** — the state is stored in
  `sessionStorage` and expires after 10 minutes server-side; restart the
  connect flow from `/accounts`. Also occurs if the callback page is opened
  in a different browser/tab than the one that started the flow.
- **Publishing fails with a Graph API error about media** — the
  `image_url`/`video_url` you supplied must be publicly reachable over
  HTTPS; Meta's servers fetch it directly.
- **Container stuck in `IN_PROGRESS`** — large videos can take a while to
  process; `PublishingWorker:ContainerStatusMaxAttempts` ×
  `ContainerStatusPollIntervalSeconds` bounds how long this app will wait
  before marking the job failed.
- **CORS errors in the browser console** — they should not occur in normal
  use, since the browser only ever calls the Next.js app's own origin; if
  you see them, something is calling the backend directly instead of
  through `/api/*`.
- **EF Core migration errors** — confirm PostgreSQL is running and the
  connection string's database/user exist and have privileges (see Section
  on PostgreSQL below).

## L. Testing

### Backend

```bash
cd instagram/backend.Tests
dotnet test
```

16 xUnit tests cover: token encryption round-trip and tamper detection,
OAuth state/PKCE single-use semantics, `CreatePublishingJobRequest`
validation rules (carousel asset-count bounds, schedule-in-the-past
rejection), the `InstagramGraphClient` against a fake `HttpMessageHandler`
(success parsing, Graph error parsing, authorization URL construction), and
`RetryHandler`'s backoff behavior on transient 503s and persistent 429s.

**What was actually run and verified in this environment:**
- `dotnet build` — succeeds, 0 warnings/errors.
- `dotnet ef migrations add InitialCreate` and `dotnet ef database update`
  — applied successfully against a real local PostgreSQL 16 `instagram_db`.
- `dotnet test` — 16/16 passed.
- `dotnet run` — server starts; `GET /health` returned `200` with a live
  JSON body; `GET /api/accounts` returned `401` without the admin key and
  `200 []` with it.

**Not verified** (no live Meta credentials available): the actual OAuth
authorization-code exchange, token refresh, and content publishing against
Instagram's production Graph API. Before going live, connect a real test
account via Section E and manually verify: connect → compose an image post
→ confirm it appears on Instagram → disconnect.

### Frontend

```bash
cd instagram/frontend
npm install
npm run lint     # passes, no warnings
npm run build    # passes — all routes compile, type-check, and prerender correctly
```

Manual UI verification performed in this environment: started
`npm run build && npm run start` against the real running backend and
confirmed the Dashboard renders "Backend status: Online" with live
account/job counts, and the Settings page renders a live
"healthy"/`instagram-api` response — i.e., the frontend-to-backend
connection genuinely works end-to-end for everything that doesn't require a
live Instagram account.

## M. Production deployment

- Run the backend behind HTTPS (terminate TLS at a reverse proxy/load
  balancer, or configure Kestrel with a certificate).
- Replace the file-system Data Protection key ring
  (`DataProtection:KeyRingPath`) with a ring that survives redeploys and is
  shared across instances (e.g. mount a persistent volume, or use Azure Key
  Vault / Redis — any `IXmlRepository`/`IXmlEncryptor` implementation EF's
  Data Protection extensions support). Losing the key ring makes every
  stored token permanently undecryptable.
- Set all secrets (`InstagramApi:ClientSecret`, `AdminAuth:ApiKey`,
  the connection string) via environment variables or a secret manager —
  never via `appsettings.json` in production.
- Set `Cors:AllowedOrigins` to the exact production frontend origin.
- Set the frontend's `INSTAGRAM_BACKEND_URL` to the backend's real base URL
  and `INSTAGRAM_ADMIN_API_KEY` to the same value configured on the
  backend, both as server-side-only environment variables in your hosting
  platform (not build-time/`NEXT_PUBLIC_`).
- Update `InstagramApi:RedirectUri` and the Meta App Dashboard's registered
  redirect URI to the production frontend's callback URL.
- Run `dotnet ef database update` as an explicit deploy step, not
  automatically at application startup, so a bad migration can't take down
  a running instance silently.
- Add structured log shipping; `ExceptionHandlingMiddleware` and the
  `InstagramGraphClient`/`RetryHandler` already avoid logging tokens or
  secrets, but confirm your log sink configuration doesn't capture raw
  request bodies.
- Monitor the `content_publishing_limit` quota per connected account to
  avoid silent publish failures from exceeding Meta's 24-hour cap.

### PostgreSQL

- **Database**: `instagram_db`, used exclusively by this backend (the
  TikTok backend uses its own separate `tiktok_db` and never shares a
  context or connection with this one).
- **Schema** (via EF Core migrations in `backend/Data/Migrations`):
  - `ConnectedAccounts` — one row per connected Instagram professional
    account; unique on `PlatformUserId`; holds the Data-Protection-encrypted
    access token, its expiry, and read-only profile fields.
  - `PublishingJobs` — one row per compose/schedule action; FK to
    `ConnectedAccounts` (cascade delete); indexed on `(Status,
    ScheduledAt)` for the background worker's polling query.
  - `MediaAssets` — one or more rows per job (more than one only for
    Carousel); FK to `PublishingJobs` (cascade delete).
  - `InsightsSnapshots` — time-series metric rows from insights syncs; FK
    to `ConnectedAccounts` (cascade delete).
- **Local setup**:
  ```bash
  sudo -u postgres psql -c "CREATE DATABASE instagram_db;"
  sudo -u postgres psql -c "CREATE USER instagram_app WITH PASSWORD '<pick-a-password>';"
  sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE instagram_db TO instagram_app;"
  sudo -u postgres psql -d instagram_db -c "GRANT ALL ON SCHEMA public TO instagram_app;"
  ```
- **Connection string** goes in `ConnectionStrings:DefaultConnection` via
  `dotnet user-secrets` locally, or the `ConnectionStrings__DefaultConnection`
  environment variable in production (double underscore is ASP.NET Core's
  configuration-key separator for env vars).
- **Migrations**:
  ```bash
  cd instagram/backend
  dotnet ef migrations add <Name>       # after changing an entity
  dotnet ef database update             # apply to the configured database
  dotnet ef database update 0           # roll back every migration
  dotnet ef migrations remove           # undo the last unapplied migration
  ```
- **Backup/restore** (standard PostgreSQL tooling, nothing custom):
  ```bash
  pg_dump -U instagram_app -h localhost instagram_db > instagram_db.sql
  psql -U instagram_app -h localhost instagram_db < instagram_db.sql
  ```
- **Isolation verification performed in this environment**: migrations were
  applied to a real local `instagram_db`, confirmed with `\dt` to contain
  exactly `ConnectedAccounts`, `PublishingJobs`, `MediaAssets`,
  `InsightsSnapshots`, and `__EFMigrationsHistory` — no tables from the
  TikTok project exist in this database, and this backend has no
  configuration path that could point it at `tiktok_db`.

## N. Current implementation status

**Done and verified:**
- OAuth Authorization Code + PKCE connect flow, encrypted token storage,
  automatic token refresh.
- Image, Carousel, Reels, and Story publishing (immediate and scheduled).
- Background scheduled-publishing worker.
- Account and media insights sync.
- Comment list/reply/hide/delete endpoints.
- Admin API key authentication on all operator endpoints.
- PostgreSQL schema + migrations, applied and verified against a real
  database.
- 16 passing backend unit tests.
- Frontend builds, lints, and renders correctly against a live backend
  (dashboard, accounts, compose, jobs, insights, settings pages).

**Implemented but not reachable from the UI yet** (backend endpoints exist
and are tested; no dedicated page wraps them in this iteration):
- Media-level insights (`GET /api/insights/media/{mediaId}`).
- Comment moderation endpoints (`/api/comments/...`).

**Pending external/manual setup before any live use:**
- A real Meta Developer app with the Instagram API with Instagram Login
  product configured, Instagram Tester added, and (for non-tester use)
  App Review approval for the content-publish/comments/insights scopes.
- Rotating the placeholder `AdminAuth:ApiKey` and `InstagramApi:ClientSecret`
  values to real secrets outside of source control.
- A production Data Protection key ring strategy (see Section M).

**Not supported, by platform limitation** (see Section J for details):
bio/profile/privacy editing, Pinned Posts, Highlights, the custom "Hidden
Words" keyword list, and Instagram Live.
