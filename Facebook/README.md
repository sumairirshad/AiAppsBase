# Tisoro Facebook Content Scheduler — analysis & implementation plan

**Status: not yet implemented.** This document is the complete feature
analysis against the "Tisoro Facebook" content playbook spreadsheet (sheets:
Main, Page ID & Profile, facebook Groups Science, Shorts, Shorts Sciences,
Image Posts, Albums, Album Titles & Description, Series, Posting Concept,
Stories, Highlights, 24/7 Live, Facebook Verified) and against Meta's actual
Graph API surface, verified against Meta's current developer documentation
(not just training knowledge — see citations inline). It exists so that
implementation starts from an accurate picture of what Meta's API can and
cannot do, the same way `../LinkedIn/README.md` does for the LinkedIn side,
which was built first per the agreed approach.

Planned stack, matching the LinkedIn project: **Next.js** (frontend) +
**.NET 8 / ASP.NET Core Web API** (backend) + **PostgreSQL** (EF Core +
Npgsql), fully independent of `../LinkedIn/` — its own frontend, backend,
database, and environment configuration.

---

## 0. Two findings that need a team decision before any code is written

These aren't engineering limitations to work around — they're places where
the spreadsheet's request and what Meta actually allows are in direct
conflict, and someone needs to decide the real intent before this gets
built.

### A. "Page ID & Profile" mixes Page fields with *personal-profile-only* fields

The spreadsheet's Page ID & Profile sheet lists, alongside genuine Page
fields (name, bio, category, phone, address, action button, links): **Date
of Birth, Relationship Status, Family Members, Gender, Favourite Quotes,
Hobbies, Music, TV Shows, Films, Games, Sports Team & Athletes, up to 450
Places you have visited, Work Experience, Education.**

These fields do not exist on a Facebook **Page** at all, in the Graph API or
in the Page admin UI — they are exclusively **personal profile** fields.
A business Page has no "relationship status" or "places visited." Two
possible explanations, and the choice changes what gets built:

1. These rows are leftover template content (e.g. copied from a personal
   profile setup guide) and should simply be ignored for Tisoro Global's
   Page. Most likely, given the sheet mixes them in with `NA` already
   filled in for most of them.
2. The intent was actually to also operate a **personal Facebook profile**
   representing the brand (separately from the Page). If so: **Meta's terms
   of service require a business/brand to use a Page, not a personal
   profile** (Facebook's Terms §3.2: "You must use your authentic identity
   on Facebook... Pages or groups [are for] business, organization, or
   non-personal use"). Operating a personal-profile account as a company
   risks the account being disabled, and there is no supported Graph API
   for managing a personal profile's timeline on someone's behalf anyway
   (the Graph API's write access to personal-profile fields was removed for
   third-party apps in the 2018 platform changes). This path isn't
   buildable or advisable regardless of API access.

**Recommendation:** treat interpretation 1 as correct (ignore the
personal-profile-only rows) unless the team explicitly confirms otherwise.

### B. Facebook Groups posting cannot be automated via API, and scraping violates Meta's Terms

The spreadsheet's "facebook Groups Science" sheet calls for posting into
"All Relevant Groups that have above 10K members," with a note to
**"Deliver to Software for Scraping using web keywords"** to discover
groups.

Both halves of this are blocked, not just hard:

- **Posting into a group via the API**: Meta's Groups API `publish_to_groups`
  permission and the feed-publish endpoints for groups **were deprecated**
  (Graph API v19.0 changelog) and are being removed across all versions —
  they only ever worked for a group the calling app itself administers, not
  for posting into public interest groups owned by other people, which is
  what the spreadsheet describes. There is no supported way to programmatically
  post into a third-party Facebook group today.
  [[Meta developer community: Groups API deprecation]](https://developers.facebook.com/community/threads/584177870580474/)
- **Scraping group membership/content**: scraping Facebook (including via
  "web keywords" automation) is explicitly prohibited by Meta's Platform
  Terms and Automated Data Collection Terms, and is the kind of activity
  Meta actively detects and bans accounts/Pages over.

**This item cannot be built as automation at all, on either half.** The only
way to execute it is a human, logged in as themselves, manually finding and
joining groups and manually posting — exactly as a person, not a bot — which
is what the spreadsheet's caption content ("Post For One Time Introduction")
already assumes a human is pasting in by hand. Recommend dropping this from
any automation scope and treating it as a pure manual/community-management
task outside this app, or re-scoping it entirely if automation here is a hard
requirement (there is no compliant way to do that automation).

---

## 1. Complete feature analysis: what the playbook asks for, what's possible

Status legend: ✅ buildable via official Graph API (with the listed
permission + App Review) · 🧩 partially buildable · 🚫 not possible via any
public API · 👤 manual by design/policy.

| Spreadsheet item | Status | Detail |
|---|---|---|
| **Page ID & Profile** — genuine Page fields (Name, Bio/About, Category, Phone, Address, Hours, Website links, Action Button, profile/cover photo) | ✅ | `POST /{page-id}` (Page edit) with `pages_manage_metadata` for most settable fields; profile/cover photo via `POST /{page-id}/picture`. Needs Meta App Review for the permission before it works on a live Page. |
| **Page ID & Profile** — personal-profile-only fields (Relationship Status, Hobbies, Interests, Travel, Work, Education, etc.) | 🚫 | See [§0.A](#a-page-id--profile-mixes-page-fields-with-personal-profile-only-fields) — these fields don't exist for Pages at all. |
| **Facebook Groups posting** | 🚫 | See [§0.B](#b-facebook-groups-posting-cannot-be-automated-via-api-and-scraping-violates-metas-terms) — API deprecated, discovery-by-scraping prohibited by Meta's Terms. |
| **Image Posts** (photo/video feed posts linking to website publications) | ✅ | `POST /{page-id}/photos` (single image) or `/{page-id}/feed` with `attached_media` (multi-photo single post). Permission: `pages_manage_posts`. |
| **Albums** (persistent photo albums with covers) | 🚫 | Meta deprecated Page Album creation in Graph API v3.3 (April 2019); the current Page Albums reference (v25.0) marks create/read/update/delete as unsupported operations outright. [[Meta Graph API reference: Page Albums]](https://developers.facebook.com/docs/graph-api/reference/page/albums/) The spreadsheet's own workaround — post a cover image, then group related posts conceptually — is the realistic substitute; there is no persistent "Album" object to create anymore. |
| **Series** (grouping merged long-form videos, like a YouTube playlist) | 🧩 | No direct Graph API equivalent of a YouTube-style playlist for Page videos for standard apps. Facebook Watch "Shows" grouping exists but has limited, mostly editorial/partner-controlled access — needs direct confirmation with Meta before counting on it; do not assume it's available. |
| **Reels** (vertical video shorts, 3–90s) | ✅ | Meta's **Reels Publishing API**: `POST /{page-id}/video_reels` (3-step: start upload session, upload file, publish). Permissions: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`. Hard cap: 30 API-published Reels per rolling 24 hours. [[Meta: Reels Publishing API]](https://developers.facebook.com/docs/video-api/guides/reels-publishing) |
| **Stories** | ✅ (direct, *better than the spreadsheet assumes*) | The spreadsheet says "we will post our Stories through Instagram integration," but Meta now has a **direct Facebook Page Stories API**: `video_stories` edge (start/upload/finish, ≤60s video) and a `photo_stories` edge (upload to `/photos` with `published=false`, then post the photo ID to `photo_stories`). This can post natively to the Facebook Page, no Instagram account required. Permissions: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`, `business_management`. [[Meta: Page Stories API]](https://developers.facebook.com/docs/page-stories-api) |
| **Highlights** (archiving Stories into permanent categories) | 🚫 | Highlights are a user-interface-only feature on both Facebook and Instagram; no Graph API exists to create or manage them programmatically on either surface, as far as current Meta documentation shows. Manual, ongoing. |
| **24/7 Live Broadcast** | 🚫 for "24/7," ✅ for bounded sessions | The spreadsheet's own "247 Live" sheet documents exactly why continuous 24/7 live isn't achievable on Facebook: an **8-hour hard cap** per standard stream, the **Continuous Live API** (which bypasses the cap) explicitly **cannot be recorded, rewound, or archived** and the whole broadcast disappears once it stops, and standard live archives **auto-delete after 30 days**. The spreadsheet's own described workaround routes the always-on merged broadcast to **YouTube**, not Facebook. What *is* buildable here: starting/ending individual Live Video sessions (`POST /{page-id}/live_videos`) up to 8 hours each, which a background scheduler could chain — but that is "repeated scheduled live sessions," not true 24/7, and every archive still expires in 30 days unless manually downloaded. |
| **Facebook Verified** (blue checkmark) | 👤 | Either a free legacy-notability application (requires independent press coverage as evidence) or a **paid Meta Verified subscription** ($14.99–$499.99+/mo per the spreadsheet's own pricing table). Both are manual, Meta-side processes with no API — and the paid tier is a recurring budget decision, not an engineering task. |
| **Posting Concept / 10-day cycle & hourly schedule** | 🧩 | Same situation as LinkedIn: the *scheduling mechanism* (any post, any datetime, background publisher) is straightforward to build once the rest of this app exists. *Auto-generating* the specific cadence chart (e.g. "Articles at 2nd hr, Guides at 5th hr...") as a recurring calendar is additional scope, not included by default. |
| **Hiring Community Post** | ✅ | Ordinary feed post (Image Posts path above) with the hiring caption template. |
| **Press Releases, Articles, Guides, Case Studies, Ebooks, Whitepapers, Industry Studies (as image posts linking to the website)** | ✅ | All are plain feed photo/video posts per the "Image Posts" sheet's own description — the website hosts the actual document; Facebook gets a thumbnail image + caption + link. No document-carousel equivalent is needed here (unlike LinkedIn) since the spreadsheet's own design already routes these as simple image posts. |

---

## 2. Facebook webhooks — what the playbook actually requires (important)

The original project brief asked generically for "Facebook webhooks and any
other necessary integrations." After reading the full Facebook playbook
spreadsheet end to end, **it does not describe any feature that requires a
webhook.** There is no lead-generation form, no Messenger bot flow, and no
comment-moderation automation anywhere in it — the one Messenger-adjacent
item is the Page's "Send Message" action button, which is just a profile
field (see §1), not an integration.

So: **no webhook is being built right now, because nothing in the source
spec calls for one.** If a concrete need shows up later, here's what each
realistic option would actually require (so it's ready to execute, not
re-researched from scratch):

| If this is ever needed | Meta product | Requirements |
|---|---|---|
| React to new comments on Page posts (e.g. to flag for the Engagement-style human review the LinkedIn side has) | Page **Webhooks**, `feed` field | A verified public HTTPS callback URL (Meta sends a GET challenge/response to verify ownership), subscribed via the app dashboard, App Review for the `pages_messaging`/feed-related permission depending on exact fields used |
| Capture leads from a Facebook/Instagram Lead Ad | **Leadgen webhook** | Same callback-URL verification, plus the `leads_retrieval` permission and a Lead Ads form actually being run (none exists in this spreadsheet today) |
| Respond to Messenger messages sent to the Page | **Messenger webhook** | Callback URL verification, `pages_messaging` permission, Meta App Review, and a defined conversation flow — none specified here |

All three share the same prerequisite this app doesn't have yet: a publicly
reachable HTTPS endpoint for the backend (works the same way once this app
is deployed somewhere with a real domain — not meaningful to stand up against
`localhost` during local development).

---

## 3. Proposed end-to-end workflow (once built)

1. **One-time setup** (human, Facebook Page admin tools): Page branding,
   address/hours, the genuine Page-profile fields from §1 not worth
   automating for a one-time edit, Meta Verified subscription decision.
2. **One-time setup** (human + this app, mirroring the LinkedIn flow): register
   a Meta Developer app, add the Facebook Page as a Business Asset, request
   App Review for `pages_manage_posts`, `pages_read_engagement`,
   `pages_show_list`, `business_management` (and `pages_manage_metadata` if
   Page-field editing is in scope), connect the Page via an OAuth flow
   analogous to `../LinkedIn/backend`'s `LinkedInAuthController`.
3. **Content creation** (human, this app): compose a post — image/photo,
   Reel (video), or Story (photo or video) — write the caption from the
   spreadsheet's documented structures, attach media, schedule a datetime
   or save as draft.
4. **Publishing** (automatic): a background service identical in shape to
   LinkedIn's `PostPublishingBackgroundService` polls for due posts and
   calls the matching Graph API endpoint per content type (`/photos`,
   `/feed`, `/video_reels`, `/video_stories` or `/photo_stories`).
5. **Outcome tracking**: Published with the Graph API's returned post/story
   ID, or Failed with the real Graph API error — same pattern as LinkedIn,
   deliberately not auto-retried.
6. **Groups, Highlights, Albums, Series, 24/7 Live, Verification**: stay
   fully manual/external to this app per §1 — nothing to automate here
   regardless of engineering effort.

---

## 4. Required permissions and configuration (for implementation)

- A Meta Developer app with **Business verification** completed (required
  before most Page permissions can go live in production, not just in
  development mode).
- Page added as an asset the app can act on, via Meta Business Suite /
  Business Manager.
- Permissions to request App Review for, scoped to what's actually used:
  `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`, and
  `business_management` for Reels/Stories; add `pages_manage_metadata` only
  if Page-profile-field editing (§1, genuine Page fields) is included.
- A long-lived Page Access Token (obtained via the standard User → Page
  token exchange), refreshed/re-derived per Meta's token-expiry rules —
  stored encrypted at rest, matching the pattern already used for LinkedIn
  tokens in `../LinkedIn/backend`.
- `.env.example`-style configuration for: Meta App ID/Secret, Page ID,
  redirect URI, DB connection string, JWT signing key, token-encryption key
  — same shape as `../LinkedIn/backend/src/Tisoro.LinkedIn.Api/.env.example`,
  to be created when implementation starts.

---

## 5. Automated vs. manual — summary

**Automatable once built:** Image/photo feed posts, Reels, Stories (photo
and video, natively on Facebook — no Instagram dependency required),
hiring/press-release/publication announcement posts, scheduling and
background publishing, Page-profile *genuine* fields (name/bio/phone/hours/
links/action button), bounded (≤8h) Live Video sessions.

**Permanently manual, regardless of engineering effort:** Groups posting
and group discovery (§0.B — policy-blocked, not just technically hard),
Highlights, true 24/7 continuous live with archiving, Facebook Verified
application/subscription, Albums (API removed by Meta), personal-profile-only
fields (§0.A — don't apply to a Page at all), Series/show grouping (status
uncertain — confirm with Meta before relying on it either way).

---

## 6. Dependencies

- Meta Developer account + **Business verification** (identity/business
  document check, Meta-side, can take days).
- App Review approval for each permission above — Meta reviews use-case
  descriptions and screen recordings of the exact flow; budget real lead
  time, this is not instant.
- A publicly reachable HTTPS URL for the backend once any webhook (§2) is
  ever added — not needed for the core posting features above.
- PostgreSQL 14+, .NET 8 SDK, Node.js 18+ — identical to the LinkedIn
  project's prerequisites.

---

## 7. Missing / needs additional development

Everything in this document describes a **plan**, not a shipped project —
unlike `../LinkedIn/`, no backend or frontend code exists here yet. Once the
two decisions in §0 are confirmed, the concrete next steps are:

1. Scaffold `Facebook/backend` (.NET 8 Web API + EF Core/Npgsql) and
   `Facebook/frontend` (Next.js), mirroring the LinkedIn project's structure.
2. Build the Meta OAuth connect flow and encrypted token storage.
3. Build the Graph API client for Photos, Feed, Reels, and Stories
   publishing (the four ✅ content types from §1).
4. Build the same Draft/Scheduled/Publishing/Published/Failed post model
   and background publisher pattern already proven out on the LinkedIn side.
5. Decide whether automatic calendar generation (§1, Posting Concept row)
   is in scope now or later — it's additive either way.
6. Defer Groups, Albums, Series, Highlights, 24/7 Live, and Verification
   entirely, per the findings above — nothing to build for any of them.
