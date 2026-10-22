# Tisoro LinkedIn Content Scheduler

A content scheduler and publisher for the Tisoro Global LinkedIn Page, built
against the "Tisoro LinkedIn" content playbook spreadsheet (sheets: Profile
ID, Header, Page Info, About Page, Job Post Feature, Job Post on Feed, Page
Button, Featured Posts, Content Types, Multi Image Post, Reels, Shorts
Sciences, Long Form Content, Ebook/IS/WP Caption, Article Caption, Posting
Concept, Weekly Calender, Hiring Post, Activity Concept, Job Post Pricing,
Post Boosts, LinkedIn Live, LinkedIn Events, Sponsored Msgs).

Stack: **Next.js** (frontend) + **.NET 8 / ASP.NET Core Web API** (backend) +
**PostgreSQL** (via EF Core + Npgsql).

This folder is fully independent of the `Facebook/` folder next to it — its
own frontend, backend, database, and environment configuration. Nothing here
depends on anything outside `LinkedIn/`.

---

## 1. Complete feature analysis: what the playbook asks for, what's possible

This is the authoritative mapping from every feature in the spreadsheet to
its real status against LinkedIn's actual public API surface (the
**Community Management API** — the only self-serve developer product
LinkedIn offers for posting as an organization). Status legend:

- ✅ **Automated** — built in this app, publishes for real through LinkedIn's API
- 🧩 **Partially automated** — the schedulable/postable part is built; a piece of it is still manual by necessity
- 🚫 **Not possible via public API** — no LinkedIn developer product exists for this at all, regardless of approval; must be done by a human in the LinkedIn UI (the spreadsheet itself documents several of these as manual steps already)
- 👤 **Manual by design** — technically postable, but LinkedIn's policies or the playbook's own process require a human action (e.g. a named sender accepting a request)

| Spreadsheet item | Status | Detail |
|---|---|---|
| **Profile ID** | N/A | Just an identifier lookup, not a feature to build. |
| **Header (logo / cover image)** | 🚫 | No public API sets an Organization Page's logo or cover image. Set once manually in LinkedIn Page admin. |
| **Page Info** (Page Name, Tagline, URL) | 🚫 | No public write API for core Organization Page profile fields. The Organizations API is effectively read-only for standard developer access; editing these requires LinkedIn Page admin access on linkedin.com. |
| **About Page** (Company Overview, Company size, Company type, Phone, Industry, Specialties, Locations, Languages) | 🚫 | Same as above — these are Page-profile fields with no self-serve write API. One-time manual setup. |
| **Verified Page Mark** | 🚫 | Entirely a LinkedIn-side review process (notability/admin verification request). No API. |
| **Job Post Feature** (native LinkedIn job listing, screening questions, "Manage Applications" external link) | 🚫 | LinkedIn job posting lives behind **Talent Solutions / Recruiter System Connect**, a completely separate partnership LinkedIn grants only to ATS/HR-tech partners — not available through the Community Management API, and not something a generic developer app can request. Must be posted by hand via LinkedIn's Jobs admin tool, exactly as the spreadsheet's own instructions describe. |
| **Job Post on Feed** (hiring announcement as a normal post) | ✅ | This is just a `Text`-content-type post — fully built. The caption template is seeded in **Caption templates**. |
| **Page Button** (custom CTA, e.g. "Contact us") | 🚫 | No write API for the Page's custom button. Manual, one-time. |
| **Featured Content** (pin a post to the top of the Page) | 🚫 | No self-serve API to manage the Featured section for an organization. Pin manually after the post you want featured is published. |
| **Long Form Content → Articles, Guides, Case Studies** | 🧩 | LinkedIn has **no API to create a native Article** (this is a linkedin.com-only authoring surface). The article is written and published on linkedin.com by a human; this app then schedules the *announcement post that links to it* — that part is ✅ automated (`ArticleLink` content type). |
| **Long Form Content → E-books, Industry Studies, Whitepapers** (posted as PDF carousels) | ✅ | `Document` content type: PDF is uploaded through LinkedIn's Documents upload API and posted as a carousel. Fully built, including the 255-char title limit and 3,000-char caption limit from the spreadsheet. |
| **Multi Image Posts (Albums)** — e.g. TLEA ceremony photos, 2–20 images | ✅ | `MultiImage` content type via LinkedIn's Images upload API + the Posts API's `multiImage` content block. Count validated 2–20 as specified. |
| **Reels** (60-second vertical video) | ✅ | `Video` content type via LinkedIn's Videos upload API (chunked multi-part upload + finalize). LinkedIn auto-assigns the thumbnail, exactly as the spreadsheet notes — no custom-thumbnail feature needed. |
| **Posting Plan / Weekly Calendar** (fixed hour-of-day cadence per content type) | 🧩 | The scheduling *mechanism* — pick any datetime, a background service publishes it automatically — is ✅ built. Auto-*generating* the recurring 30-day calendar pattern from the spreadsheet's chart (e.g. "Article at 12th hr, every day") is **not** built; each post is scheduled individually today. See [§4 Missing / needs more development](#4-missing--needs-more-development) if you want that automated too. |
| **Hiring Post** (as a dedicated feed post, 1/week) | ✅ | Same as Job Post on Feed above. |
| **Post Boost** (paid promotion of hiring posts; $300 budget, 50-city targeting, job-title targeting) | 🚫 (today) | This is LinkedIn **Campaign Manager / Marketing API** — a distinct product requiring **LinkedIn Marketing Developer Platform** partnership, separate from and additional to the Community Management API this app uses. It also spends real advertising budget per click/send, which is a business decision, not just an engineering one. Not built; would need its own partnership approval plus an explicit sign-off on ad spend before any automation touches it. Run manually via LinkedIn's Boost UI for now, exactly as the spreadsheet's own step-by-step describes. |
| **LinkedIn Live** | 🚫 | Requires a third-party RTMP broadcast tool (OBS, etc.) and a stream key generated manually in LinkedIn's broadcast settings — there is no "start a LinkedIn Live" API for standard developer access. Fully a human/software-operations task outside this app's scope. |
| **LinkedIn Events** (creation, registration form, reminders) | 🚫 | No public Events-creation API; the spreadsheet's own "How It Works" section is a list of manual UI clicks. The *event description and feed-caption copy* can be drafted using the documented prompt (stored as a caption template pattern) but the event itself must be created by hand. |
| **Sponsored Messaging** (Message Ads / Conversation Ads) | 🚫 + 👤 | Same Marketing API gating as Post Boost, **plus** a structural manual step the spreadsheet itself requires regardless of any API: a named human sender (e.g. Syed Savez Ali) must personally accept being the message's sender — LinkedIn requires that consent from the real profile, it cannot be granted by an app. |
| **Activity Concept** — Reposting | 🧩 | LinkedIn's Posts API *can* technically create a re-share, but the spreadsheet's own process is "tell Savez/Adnan to manually repost with their own added insight" — i.e. intentionally a personal, human-voiced repost, not an automated one. Not built; would contradict the documented intent if automated. |
| **Activity Concept** — Comments / Reactions on other members' posts | 🧩 | LinkedIn's API cannot post a comment or reaction on behalf of a member on someone else's content for a standard app — only a member's own client session can. This exactly matches the spreadsheet's own design ("AI recommends, Savez/Adnan manually posts"). Built as the **Engagement** tracker: log a target profile + a suggested comment/reaction, mark it done once a human has posted it manually on linkedin.com. |

### A note on scope versus the original Facebook-style request

Earlier in this project's history, generic integration requirements
(Facebook-style "implement webhooks and required integrations") were asked
for across both platforms. **LinkedIn's Community Management API has no
webhook/event-subscription product for organic content** (no equivalent of
Facebook's Page webhooks) — there is nothing to subscribe to here. The
closest LinkedIn offering, UGC/engagement webhooks, is not part of the
self-serve Community Management API either. Nothing is missing from this
build because of that; it genuinely does not exist for a standard developer
app.

---

## 2. End-to-end workflow

1. **One-time setup** (human, LinkedIn UI): Page branding (logo/cover),
   Page Info/About fields, Page Button, company verification — see the
   feature table above, all 🚫 items. Done once outside this app.
2. **One-time setup** (human, this app): register the LinkedIn Developer
   app, request Community Management API access, connect the Tisoro Global
   Page via **Settings → LinkedIn connection** (§5 below).
3. **Content creation** (human, this app): a Tisoro team member opens
   **New post**, picks a content type (Text, Image, MultiImage, Video,
   Document, ArticleLink), optionally starts from a caption template,
   uploads media where required, writes the caption, and either saves it as
   a **Draft** or sets a **Schedule for** datetime.
4. **Publishing** (automatic): the background `PostPublishingBackgroundService`
   polls every 60 seconds (configurable) for Scheduled posts whose time has
   passed. For each one it uploads any attached media to LinkedIn first
   (Images/Videos/Documents upload APIs), then calls `POST /rest/posts`.
   A human can also click **Publish now** on any Draft/Scheduled post to
   skip the wait.
5. **Outcome tracking** (automatic + human): on success the post is marked
   **Published** with LinkedIn's own post URN recorded. On failure it's
   marked **Failed** with the real error (e.g. expired token, rejected
   content) — never silently retried. A human fixes the underlying problem
   (most commonly: reconnect LinkedIn) and clicks **Retry**.
6. **Engagement loop** (human, assisted by this app): daily, a team member
   checks which tracked LinkedIn profiles (co-authors, Page followers who
   publish) have new activity, logs a suggested comment/reaction/repost in
   the **Engagement** page, then manually performs it on linkedin.com from
   their own account and marks the task **Done**.
7. **Everything marked 🚫 above**: stays a fully manual, separate workflow
   outside this app (Jobs, Live, Events, Sponsored Messaging, Post Boost,
   Page profile edits) — this app does not attempt it, and nothing in
   LinkedIn's public API would let it.

---

## 3. Required permissions and configuration

**LinkedIn Developer app:**
- Must be created under the Tisoro Global Page by a current Page admin.
- Must request and be **approved** for the **Community Management API**
  product. This is a manual LinkedIn review, not instant/self-serve, and
  can be declined or take time — treat it as a dependency with lead time,
  not a checkbox.
- OAuth scopes requested by this app: `openid profile w_member_social
  w_organization_social rw_organization_admin`.
  - `rw_organization_admin` — to resolve which organization(s) the
    connecting admin administers.
  - `w_organization_social` — to post as the organization.
  - `w_member_social` / `openid profile` — member identity for the OAuth
    handshake itself.
- The human who clicks **Connect LinkedIn Page** must be a **Super Admin**
  or **Content Admin** of the Page — a regular member or a non-admin
  personal profile cannot authorize posting as the organization.
- If the Page sits under a LinkedIn **organization** (not an individual's
  Page), that organization may separately need to approve the app before
  `w_organization_social` actually works for it — a LinkedIn-side admin
  step outside this app's control.

**Application configuration:** see `backend/src/Tisoro.LinkedIn.Api/.env.example`
for the full list (connection string, JWT signing key, token-encryption
key, LinkedIn client ID/secret/redirect URI, initial admin credentials,
CORS origin, media storage path).

---

## 4. Missing / needs more development

Things genuinely out of scope for *this* build (not for lack of trying, but
because they're either not exposed by any public API, or depend on a
business/partnership decision beyond engineering):

- **Automatic calendar generation.** The app can schedule any single post
  for any datetime, but it does not yet read the spreadsheet's 10/30-day
  cadence chart and auto-generate a month of scheduled posts. Doable as a
  follow-up (a small script or admin-UI "bulk schedule" feature consuming
  the same `POST /api/posts` endpoint the UI already uses) — not built now
  because it wasn't part of the agreed MVP scope (content scheduler +
  publisher, not a full calendar-automation engine).
- **LinkedIn Marketing Developer Platform integration** (Post Boost,
  Sponsored Messaging). Needs its own LinkedIn partner application, is
  architecturally a different API (Campaign Manager, not Community
  Management), and spends real money — should be scoped and approved as its
  own project, not bolted onto this one.
- **Jobs / Talent Solutions integration.** Not obtainable through a
  standard developer app at all; would require LinkedIn to grant a
  Recruiter System Connect-style partnership, which is a sales/BD
  conversation with LinkedIn, not something this app's credentials can ever
  unlock.
- **LinkedIn Live / Events creation.** No public API exists for either; any
  future "automation" here would only ever be drafting copy (captions,
  descriptions) for a human to paste into LinkedIn's UI, which the Caption
  Templates feature could be extended to cover if wanted.
- **Page profile field editing** (About, Specialties, Company size, Page
  Button, Header images, Featured content). No write API; would need to
  stay a manual checklist even with more engineering effort, because the
  capability doesn't exist on LinkedIn's side.

Nothing above was skipped by oversight — each is documented here with the
specific reason it can't currently be automated, so a future decision to
pursue it (e.g. applying for Marketing Developer Platform access) starts
from an accurate picture instead of rediscovering these limits.

---

## 5. Repository layout

```
LinkedIn/
  backend/
    Tisoro.LinkedIn.sln
    src/Tisoro.LinkedIn.Api/       ASP.NET Core Web API
    tests/Tisoro.LinkedIn.Api.Tests/  xUnit tests (unit + real-DB integration)
  frontend/                        Next.js app (App Router, TypeScript)
```

## 6. Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/) and npm
- PostgreSQL 14+ (local install, Docker, or a managed instance)
- A LinkedIn Developer app with access to the **Community Management API**
  product (see §3 above) — required only for actually publishing to
  LinkedIn; everything else (composing, scheduling, the admin UI) works
  without it.

## 7. Database setup

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

## 8. Backend setup

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

## 9. Frontend setup

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

## 10. LinkedIn app setup (step by step)

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

## 11. Running tests

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

## 12. How publishing works (automated processes)

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

## 13. Security notes

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
