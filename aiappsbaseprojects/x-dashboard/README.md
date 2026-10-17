# X Dashboard

A management dashboard prototype for X (Twitter) accounts. This is a demo/prototype
phase project: there is no real X API integration, no authentication, and no
persistent database. All data is mock/dummy data served from seed files, and any
content a user creates or edits lives only for the current session, in the
backend's in-memory mock store and the browser (local object URLs for uploaded
media, in-memory caches for previews).

The API layer is structured as a swappable mock data layer so the in-memory
stores and seed fixtures can be replaced with a real database and the real X API
later without restructuring the controllers or the frontend API contracts.

## Tech stack

- **Backend:** ASP.NET Core Web API (.NET 8)
- **Frontend:** Next.js (App Router) with TypeScript, shadcn/ui, and Tailwind CSS

## Pages

- **Dashboard** – account overview: totals, engagement charts, recent posts, upcoming scheduled posts
- **Profile** – handle, display name, bio (160 character limit), profile picture, cover image, account type, category, contact info, location, website, pinned post
- **Posts** – create, edit, and list text and image posts
- **Shorts** – list, upload (mock video file), caption, description, and hashtags for short vertical clips
- **Scheduler** – pick a date and time to schedule a post; list and calendar views of scheduled vs. published items
- **Twitter Premium** – read-only status panel showing the mock account's subscription tier and verified badge status

## Project structure

```
x-dashboard/
  backend/    ASP.NET Core Web API (mock data layer, in-memory stores, seed JSON fixtures)
  frontend/   Next.js App Router frontend
```

## Prerequisites

- [.NET SDK 8.0](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) and npm

## Running the backend

```bash
cd backend
dotnet restore
dotnet run
```

The API listens on `http://localhost:5080` by default (configured in
`appsettings.json`). Swagger UI is available at `http://localhost:5080/swagger`
in the Development environment.

All configurable values (listen URL, mock data seed directory, allowed CORS
origins) live in `backend/appsettings.json` and
`backend/appsettings.Development.json`, bound through strongly-typed options
classes (`MockDataOptions`, `CorsOptions`) rather than hardcoded in code.

## Running the frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The app runs on `http://localhost:3000` and loads directly into the dashboard
(no login screen).

## Environment variables

The frontend reads its backend API URL from an environment variable instead of
a hardcoded value. See `frontend/.env.example`:

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the backend API | `http://localhost:5080` |

## Data handling notes

- The backend has no database. Seed data lives in `backend/Seed/*.json` and is
  loaded into in-memory stores on startup. Restarting the backend resets all
  data back to the seed fixtures.
- Uploaded media (profile picture, cover image, post images, short video files)
  has no real file storage in this phase. The frontend creates local object
  URLs / in-memory caches for previews and playback for the current browser
  session; these are not persisted anywhere and are lost on refresh.
- Structured content (post text, scheduled post metadata, profile fields, short
  captions/hashtags) is persisted in the backend's in-memory store for the
  lifetime of the backend process, through the same REST contracts a real
  database-backed implementation would use.
