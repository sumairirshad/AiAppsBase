# YouTube Content Planner (MVP)

A minimal web app replacing a YouTube content-planning Excel sheet. Lets you
add, view, and edit planning entries (title, status, date, notes) across
8 categories: Channel Profile, Playlists, Podcasts, Shorts, Videos,
Community Posts, Posting Concept, and Live Broadcast.

## Setup

```bash
cd youtube-manager
npm install
npm run dev
```

Open http://localhost:3000.

## Data mode

Controlled by `USE_MOCK_DATA` in `.env.local`:

- `USE_MOCK_DATA=true` — uses hardcoded sample data (`lib/mockData.js`),
  reset on server restart. Good for testing the UI.
- `USE_MOCK_DATA=false` — reads/writes `data/db.json`, a local JSON file
  acting as a placeholder "real" data source. The functions in
  `lib/realData.js` are structured so they can later be swapped for real
  YouTube API calls without changing anything else in the app.

All pages and actions go through `lib/dataService.js`, which checks the
env var and routes to the right source.

## Structure

- `app/page.js` — dashboard listing the 8 categories
- `app/[category]/page.js` — list + add-entry form for a category
- `app/[category]/[id]/page.js` — edit-entry form
- `lib/categories.js` — the 8 categories and status options
- `lib/dataService.js`, `lib/mockData.js`, `lib/realData.js` — data layer
