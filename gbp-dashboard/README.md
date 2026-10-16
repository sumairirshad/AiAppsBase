# GBP Dashboard

A Google Business Profile (GBP) management dashboard prototype. It lets a business owner manage their profile info, logo and cover photo, posts (Update / Event / Offer), a post scheduler, and a media gallery from a single dashboard.

This is a **mock/demo phase** build:

- There is no real Google Business Profile API integration yet.
- There is no real database. The backend serves seeded mock data from in-memory repositories.
- Edits you make in the UI (profile fields, logo/cover, posts, scheduling, media) are kept in your browser's `localStorage` and layered on top of the seeded data. Nothing is written back to the backend or any persistent store.
- The backend's API contracts (DTOs, repository interfaces, controllers) and the frontend's data layer (`src/lib/data/*`) are structured so the mock data source can later be swapped for a real database and the real Google Business Profile API without a major rewrite — only the implementations behind those interfaces need to change.
- There is no authentication. The app loads directly into the dashboard.

## Tech stack

- **Backend:** ASP.NET Core Web API (.NET 8)
- **Frontend:** Next.js (App Router) with TypeScript, Tailwind CSS, and shadcn/ui

## Project structure

```
gbp-dashboard/
├── backend/   ASP.NET Core Web API (.NET 8)
└── client/    Next.js app (TypeScript, Tailwind, shadcn/ui)
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

By default the API listens on `http://localhost:5115` (see `backend/Properties/launchSettings.json`). Swagger UI is available at `http://localhost:5115/swagger` while running in the `Development` environment.

Configuration lives in `backend/appsettings.json` and `backend/appsettings.Development.json` — nothing is hardcoded in code. Notable settings:

| Section | Key | Purpose |
| --- | --- | --- |
| `Cors.AllowedOrigins` | string array | Origins allowed to call the API (the frontend's URL) |
| `MockData.UseMockData` | bool | Reserved flag indicating the API is serving mock data |
| `MockData.SimulatedLatencyMs` | number | Artificial delay added to mock responses, useful for testing loading states |
| `GoogleBusinessProfile.*` | — | Placeholder settings for wiring up the real Google Business Profile API later |

## Running the frontend

```bash
cd client
npm install
cp .env.example .env.local
npm run dev
```

The app runs on `http://localhost:3000` and expects the backend to be running at the URL configured in `NEXT_PUBLIC_API_BASE_URL`.

## Environment variables

The frontend reads configuration from environment variables. Copy `client/.env.example` to `client/.env.local` and adjust as needed:

| Variable | Description | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the backend API | `http://localhost:5115` |

## Pages

- **Dashboard** — profile summary and key stats (posts, scheduled items, media)
- **Logo & Cover** — upload/update the logo and cover photo (mock upload, stored in the browser)
- **Business Profile** — name, category, description, contact info, and business hours
- **Posts** — create, edit, and list Update / Event / Offer posts
- **Scheduler** — pick a date and time to schedule a post; view scheduled vs. published items in a calendar and list
- **Media Gallery** — browse, add, and remove mock photos and videos

## Resetting demo data

Since all user edits are stored in `localStorage`, you can reset the dashboard back to the seeded state at any time by clearing your browser's site data for `localhost:3000` (or opening the app in a private/incognito window).
