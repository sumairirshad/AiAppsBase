# X Dashboard

A management dashboard for a single X (Twitter) account, backed by the real X API v2 (plus two
legacy v1.1 endpoints that have no v2 equivalent). There is no mock data anywhere in this
project: every page reads and writes the connected X account through genuine, authenticated API
calls, and a feature that the X API doesn't support says so instead of faking success.

## A. Project overview

**What it does.** Dashboard overview (follower counts, recent posts, engagement, upcoming
scheduled posts), profile editing, text/image posting, short vertical-video posting, a post
scheduler, and a read-only X Premium status panel -- all for one connected X account.

**The X integration.** The backend (`backend/`) is the only thing that ever talks to X. It
implements the OAuth 2.0 Authorization Code + PKCE flow to get a user access token on behalf of
the connected account, then uses that token to call the real X API v2 endpoints (tweet create/
delete/lookup, user lookup, pinned posts, chunked media upload) and, for the handful of
operations v2 doesn't cover, two legacy v1.1 endpoints. The X API client secret and the
resulting access/refresh tokens never reach the browser.

**Major components:**

```
x-dashboard/
  backend/    ASP.NET Core Web API (.NET 8) -- the real X API integration lives entirely here
    Services/X/            OAuth flow, token storage, the X API HTTP client
    Services/Real/          Maps X API responses onto this app's Post/Profile/Short/etc. models
    Services/Scheduling/    App-level "scheduled post" bookkeeping + the background publisher
    Controllers/            REST endpoints the frontend calls
    XDashboard.Api.Tests/   xUnit tests for the pure logic (PKCE, token encryption, text
                            composition, dashboard aggregation) -- no network access required
  frontend/   Next.js (App Router) + TypeScript + shadcn/ui + Tailwind CSS
```

**Technologies:** ASP.NET Core Web API (.NET 8), Next.js 14 App Router, TanStack Query, X API v2
(OAuth 2.0 Authorization Code + PKCE, tweets, users, chunked media upload) and X API v1.1
(`account/update_profile*`, used only because v2 has no equivalent).

## B. Prerequisites

- [.NET SDK 8.0](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) and npm
- An **X Developer account** with a Project/App that has **OAuth 2.0 enabled with "Read and
  write" user authentication settings** (see section C) -- required for every feature in this
  app, since even reading your own profile requires a user access token (X does not support
  app-only/Bearer-token access to `/2/users/me`).
- `openssl` (or any way to generate a random 32-byte base64 value) to create
  `TOKEN_ENCRYPTION_KEY`.

## C. X Developer account setup

1. **Create or access an X Developer account** at
   [developer.x.com](https://developer.x.com/en/portal/petition/essential/basic-info). You need
   a standard X account first; the developer account is free to create.
2. **Create a Project and an App** inside the [developer portal](https://developer.x.com/en/portal/dashboard).
   Any app type works; "Web App, Automated App or Bot" is the closest fit.
3. **Enable OAuth 2.0 and set permissions.** In the app's **User authentication settings**:
   - Turn on **OAuth 2.0**.
   - App permissions: **Read and write** (required to post, delete, pin, and upload media; a
     "Read" app cannot do any of the write-side features this dashboard has).
   - Type of app: **Web App, Automated App or Bot** (this makes it a confidential client, which
     is what the backend's OAuth flow expects -- it authenticates with a client secret).
   - **Callback URI / Redirect URL**: must exactly match `X_CALLBACK_URL` (see section D), e.g.
     `http://localhost:5080/api/auth/x/callback` for local development.
   - **Website URL**: your frontend URL, e.g. `http://localhost:3000`.
4. **Obtain credentials.** Under **Keys and tokens**, generate and copy the **OAuth 2.0 Client
   ID and Client Secret**. These map to `X_CLIENT_ID` / `X_CLIENT_SECRET`.
5. **Scopes.** This app requests `tweet.read tweet.write users.read offline.access media.write`
   on every connection (see `X_OAUTH_SCOPES` in section D) -- that's the full set every feature
   here needs. `offline.access` is what gets you a refresh token; without it the connection
   expires after about two hours and has to be re-established.
6. **Pick an API access tier and verify it covers what you need** -- see section F. In short:
   posting, deleting, pinning, and media upload work on the **Free** tier; reading your own
   posts/timeline for the Dashboard, Posts, and Shorts pages requires **Basic** ($200/mo) or
   higher, because the Free tier does not include read access to tweet/timeline endpoints.
   Pricing and tier names change; verify current figures at
   [developer.x.com/en/products/x-api](https://developer.x.com/en/products/x-api) before
   assuming a number from this README is still accurate.

## D. Environment configuration

### Backend (`backend/.env`, copy from `backend/.env.example`)

| Variable | Required | Description |
|---|---|---|
| `X_CLIENT_ID` | Yes | OAuth 2.0 Client ID from the X Developer Portal. |
| `X_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret. Server-side only; never sent to the browser. |
| `X_CALLBACK_URL` | Yes | Must exactly match the callback URL registered on the app, e.g. `http://localhost:5080/api/auth/x/callback`. |
| `TOKEN_ENCRYPTION_KEY` | Yes | Base64, 32 bytes, used to encrypt the connected account's tokens at rest. Generate with `openssl rand -base64 32`. |
| `X_OAUTH_SCOPES` | No | Overrides the default scope list (`tweet.read tweet.write users.read offline.access media.write`). Only change this if you deliberately want to request fewer scopes (some features will then fail). |
| `FRONTEND_BASE_URL` | No | Where the browser is redirected after the OAuth callback. Defaults to `http://localhost:3000`. |

Separately, `backend/appsettings.json` has a `Cors.AllowedOrigins` list controlling which
frontend origin may call this API (already set to `http://localhost:3000` for local dev) --
not a `.env` variable, since it's not a secret.

The backend fails to start with a clear error listing exactly which variables are missing if any
required one is unset -- it will not silently run in a half-configured state.

### Frontend (`frontend/.env.local`, copy from `frontend/.env.example`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | No | Base URL of the backend API. Defaults to `http://localhost:5080`. |

Nothing secret lives in the frontend's environment -- the client secret and access/refresh
tokens are only ever held by the backend.

### Production

Set the same backend variables as real environment variables on whatever host runs the
ASP.NET Core app (App Service, a container platform's secret/env config, etc.) rather than
shipping a `.env` file. Set `X_CALLBACK_URL` and `FRONTEND_BASE_URL` to your real HTTPS domains,
and add the production frontend origin to `Cors.AllowedOrigins` in `appsettings.json` (or an
environment-specific `appsettings.Production.json`). Register the production callback URL in
the X Developer Portal as well -- X rejects any callback that doesn't exactly match.

## E. Installation and startup

```bash
git checkout claude/admiring-archimedes-tqthu2   # or whichever branch has this feature
```

### Backend

```bash
cd aiappsbaseprojects/x-dashboard/backend
cp .env.example .env    # then fill in the real values (see sections C and D)
dotnet restore
dotnet run
```

The API listens on `http://localhost:5080` (configured in `appsettings.json`). Swagger UI is
available at `http://localhost:5080/swagger` in the Development environment.

Run the test suite (pure logic only -- no network access, no credentials required):

```bash
cd XDashboard.Api.Tests
dotnet test
```

For a production build/run:

```bash
dotnet publish -c Release -o out
dotnet out/XDashboard.Api.dll
```

### Frontend

```bash
cd aiappsbaseprojects/x-dashboard/frontend
cp .env.example .env.local
npm install
npm run dev
```

The app runs on `http://localhost:3000`. On first load, nothing is connected yet -- open the
**Profile** page (or use the sidebar) and click **Connect to X**, which redirects to X's
authorization page and back.

For a production build:

```bash
npm run build
npm run start
```

## Feature-by-feature: what's real, and what the X API simply doesn't support

| Feature | Real endpoint(s) used | Notes |
|---|---|---|
| Dashboard summary | `GET /2/users/me`, `GET /2/users/:id/tweets` | `TotalPosts` uses the account-wide `public_metrics.tweet_count`; shorts count and the engagement chart are computed only from the most recent page of posts the API returns (X exposes current cumulative per-post metrics, not a historical time series). |
| Profile (view) | `GET /2/users/me` | Follower/following counts, bio, location, website, pinned post are all real. |
| Profile (edit name/bio/location/website) | `POST account/update_profile` (legacy v1.1 -- v2 has no write endpoint for these fields) | Account type, category, phone, and email are shown read-only/empty: the X API does not expose a way to read or write them at all. |
| Profile picture / cover image | `POST account/update_profile_image`, `POST account/update_profile_banner` (legacy v1.1) | These require the actual image bytes, not a URL; the frontend uploads the file directly. |
| Pinned post | `POST`/`DELETE /2/users/:id/pinned_tweets` | Real, both from the Profile page and the Posts page's pin button. |
| Posts: list/create/delete/pin | `GET/POST/DELETE /2/tweets`, `GET /2/users/:id/tweets` | Image posts upload through the chunked media endpoint first, then attach the resulting media id. |
| **Posts: edit** | *(none)* | **Not possible.** The X API has no endpoint to edit a published post's text or media -- see [docs.x.com/x-api/fundamentals/edit-posts](https://docs.x.com/x-api/fundamentals/edit-posts). The UI does not offer an edit button for a published post; delete and repost instead. |
| Shorts (vertical video posts) | Chunked `POST /2/media/upload` (video) + `POST /2/tweets` | X has no separate "Shorts" product/API. A short is modeled as a video post; caption/description/hashtags are folded into the post's 280-character text and best-effort split back out when read, since X doesn't store them as separate fields. |
| **Scheduler** | *(no native X endpoint)* + `POST /2/tweets` at the scheduled time | **The X API cannot schedule a post for you.** This is implemented as an honest app-level feature: scheduled posts are kept in the backend's in-memory store, and a background service (`SchedulerPublishingService`) polls every 30 seconds and calls the real "create post" pipeline the moment a post's time arrives. This requires the backend process to keep running; if it's down when a post's time arrives, it publishes late, on the next tick after restart. |
| X Premium status | `GET /2/users/me` (`subscription_type`, `verified_type`, `verified`) | Read-only, as the UI says. X does not expose a subscription start date, renewal date, or benefits list over the API, so those are not fabricated here. |

## F. API pricing: free or paid?

**Running the app locally is free** -- the .NET and Next.js toolchains, and this codebase, cost
nothing. Whether the *X integration* works for free depends entirely on your X API access tier,
and tiers/pricing are controlled by X and change over time. Verify current figures at
[developer.x.com/en/products/x-api](https://developer.x.com/en/products/x-api) and the
[X API docs](https://docs.x.com) before relying on anything below.

As of this writing, X API v2 access is tiered roughly like this:

- **Free**: OAuth 2.0 user-context write access (post, delete, pin, upload media) at a low
  monthly post cap, but **no read access** to tweet lookup or timeline endpoints. On Free, you
  can post, delete, pin posts, upload images/video, and run the scheduler -- but the Dashboard,
  Posts list, and Shorts list (all of which read your timeline back) will fail with a real,
  visible error from X, not fake data.
- **Basic** (paid, historically ~$200/month): adds meaningful read access -- tweet lookup and
  user timelines -- which is what the Dashboard/Posts/Shorts *list* views need, plus higher
  write caps.
- **Pro** and **Enterprise**: higher limits still, for scale this dashboard doesn't need.

**Bottom line for this app:**
- Writing (post, delete, pin, upload media, the scheduler calling those same write endpoints)
  can work on the **Free** tier.
- Reading your own posts back (Dashboard totals/engagement, the Posts list, the Shorts list)
  needs **Basic** or higher, because Free excludes read endpoints.
- Profile read/write (`/2/users/me`, the legacy profile/image/banner endpoints) and the Premium
  status panel need at minimum a user-context-authenticated app; verify these specific
  endpoints' current tier requirements in the X API docs, since X has changed what Free covers
  more than once.
- Rate limits apply per endpoint regardless of tier (see `x-rate-limit-*` response headers); the
  backend surfaces a real "rate limited, retry in Ns" error rather than silently retrying forever
  or falling back to fake data.
- An X Developer account and an app with OAuth 2.0 "Read and write" permissions (section C) is
  required no matter which tier you're on -- there is no feature in this app that works without
  a connected, authenticated account.

## Architecture notes

- **No fallback to fake data.** If the X API call fails (not connected, rate limited, X is down,
  invalid/expired token), the backend returns a real error (`401`/`403`/`429`/`5xx` with a
  structured `{ message, code }` body) and the frontend shows that message -- see
  `ApiExceptionMiddleware` (backend) and `ApiErrorState` (frontend).
- **Tokens stay server-side.** The OAuth 2.0 Authorization Code + PKCE exchange, token refresh,
  and every authenticated X API call happen in the backend. Tokens are encrypted at rest
  (`EncryptedInMemoryTokenStore`, AES-256-GCM) and are held in memory for this phase -- consistent
  with the rest of the app's data (see below), a restart requires reconnecting. A production
  deployment that needs connections to survive a restart should swap in a persistent,
  encrypted-at-rest store behind the same `ITokenStore` interface.
- **Scheduled posts are the one piece of genuinely local state**, because no X scheduling API
  exists. They're also in-memory for this phase; swap `InMemorySchedulerStore` for a database-
  backed implementation behind `ISchedulerStore` if you need them to survive a restart.
- Everything else -- profile, posts, shorts, premium status -- is a live read-through of the X
  API with no local cache beyond what TanStack Query holds for the current browser session.
