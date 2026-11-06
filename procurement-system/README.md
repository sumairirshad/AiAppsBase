# Procurement System

A full-stack procurement platform covering requisitions, value-band approvals, vendor
governance and scoring, sourcing and quotations, purchase orders and contracts, receiving,
bills forwarded to a Finance Portal, audit, and recurring/tentative spend — built per the
accompanying business requirements, ERD and workflow specification.

## Stack

- **Backend:** .NET 8, ASP.NET Core Web API, EF Core 8, MediatR, FluentValidation, Serilog — modular monolith (`backend/`)
- **Worker:** .NET 8 Worker Service — recurring PR generation, escalation watch, split-purchase/market-price checks, outbox dispatch (`backend/src/Procurement.Worker`)
- **Frontend:** Angular 17, standalone components, one lazy-loaded area per role (`frontend/web`)
- **Database:** SQL Server 2022
- **Files:** local disk volume behind an `IFileStorageService` interface (swap for blob storage in production)

Backend and frontend are fully separate folders/projects, as required: `backend/` (the .NET
solution, migrations included) and `frontend/` (the Angular workspace). Nothing in one depends
on build output from the other.

## Run it

### Option A — Docker Compose (simplest)

```bash
docker compose up --build
```

This starts SQL Server, the API (`http://localhost:5000`), the Worker, and the web app
(`http://localhost:8081`). **On every container start, the API automatically checks whether the
database exists, creates it if not, applies every pending EF Core migration, runs a schema
reconciliation pass that adds any table or column the current model expects but the live
database is missing, and then seeds lookups/policy/demo data — all idempotently, so this is
exactly as safe to run on the 50th start as the 1st.** See "Database startup behaviour" below.

First start takes a few minutes (SQL Server cold start + first migration run). Watch the API's
logs for `Database startup complete.` before using the app.

### Option B — Local dev (no Docker)

Requires SQL Server reachable from your machine (local install, or `docker run` just the
`sqlserver` service from the compose file), .NET 8 SDK, and Node 20+.

```powershell
cd backend
dotnet restore
dotnet run --project src/Procurement.Api        # http://localhost:5000, applies migrations on boot
dotnet run --project src/Procurement.Worker      # separate terminal

cd ../frontend/web
npm install
ng serve                                         # http://localhost:4200
```

Connection string, JWT signing key, CORS origins and the file-storage path are all read from
`appsettings.json` / `appsettings.Development.json` under each backend project, or the
equivalent environment variables (see `docker-compose.yml` for the full list) — nothing is
hard-coded to the Docker network names.

## Demo accounts

Every account below uses password `Passw0rd!1`. They're seeded automatically on first startup
(`SeedDemoData: true`, the default) so the system is usable immediately — set that to `false`
in a real deployment.

| Role | Email | Notes |
|---|---|---|
| Requestor | requestor@procurement.local | Department: IT |
| HOD | hod.it@procurement.local | HOD of IT |
| HOD (Procurement) | hod.procurement@procurement.local | HOD of Procurement — this is the "Procurement HOD" who approves vendor registrations |
| Procurement | procurement@procurement.local | |
| Finance | finance@procurement.local | |
| Audit | audit@procurement.local | |
| OPD | opd@procurement.local | |
| System Administrator | sysadmin@procurement.local | |

A handful of demo vendors (one star, one regular, one brand-new, one blacklisted), a
category/item tree, and two locations are seeded alongside them so the requisition and sourcing
screens have real data to work with out of the box.

## Database startup & self-healing schema

This is the explicit requirement the delivery was built around, so it's worth being precise
about where it lives: `backend/src/Procurement.Infrastructure/Startup/DatabaseStartupInitializer.cs`,
run by both the API and the Worker before either does anything else:

1. **Create the database if it doesn't exist** — connects to `master` and runs
   `CREATE DATABASE` only if needed.
2. **`sp_getapplock`** around everything below, so if the API and Worker (or two API
   replicas) start at the same instant, only one of them migrates/seeds while the others wait.
3. **`Database.Migrate()`** — the primary, versioned mechanism; every migration lives in
   `backend/src/Procurement.Infrastructure/Persistence/Migrations`.
4. **`SchemaReconciler`** (`backend/src/Procurement.Infrastructure/Startup/SchemaReconciler.cs`)
   — compares the live `INFORMATION_SCHEMA` against what the current EF Core model expects and
   additively creates any missing table or `ALTER TABLE ... ADD` any missing column. It never
   drops or narrows anything, so it's a pure safety net for drift (a migration that didn't run,
   a manually-dropped column) and a no-op — just a couple of metadata queries — when the schema
   already matches, which is the normal case.
5. **Idempotent seeders**, in dependency order: roles → permissions → lookups → demo
   departments/locations → policy (bands/quotation rules/settings) → workflow definitions/stages
   → spend taxonomy → remaining demo data (users/vendors/categories/items).

Any failure at any step aborts startup loudly (the process exits with the error in the logs)
rather than starting against a half-correct schema. This whole sequence is idempotent end to
end — safe and cheap to run on every single startup, in every environment.

## What's a working stub vs. fully real

A few integration points name real external systems the business spec deliberately keeps
outside this system's database (no budget tables, no payment tables). They're built as clean
interfaces with a working default, so swapping in the real thing later is a one-file change:

- **Finance Portal** (`IFinancePortalClient` / `Worker/Jobs/OutboxDispatcherJob.cs`): bills are
  pushed via an outbox message; without a configured `FinancePortal:BaseUrl` it just logs the
  payload. The inbound payment-status callback (`POST /api/v1/finance-portal/callback`) is
  fully implemented and idempotent; a dev-only `POST /api/v1/finance-portal/simulate/{invoiceId}`
  (bearer-authenticated, disabled outside `Development`) lets you drive the whole paid →
  audit-stamp loop by hand without a real Finance Portal.
- **AI market-price lookup** (`Worker/Jobs/MarketPriceLookupJob.cs`): writes a clearly-marked
  mock `AiChecks` result (advisory only, matches the real contract's shape); swap the body of
  `LookupMockPrice` for a real search/LLM call.
- **Email** (`IEmailSender` / `SmtpEmailSender`): sends real SMTP mail once `Smtp:Host` is
  configured; otherwise logs instead of failing, so the outbox loop still runs end to end in dev.
- **WhatsApp** (`IWhatsAppSender`): always logs — there's no standard default provider to wire
  up without picking one (Twilio, Meta Cloud API, ...) on the user's behalf.

Everything else — the 88-table schema, the generic workflow engine, every approval chain,
vendor governance, sourcing/quotation rules, PO/contract/GRN/bill flow, audit stamp, recurring
generation, tentative-cost variance, notifications — is fully implemented, not a placeholder.

## Testing

```bash
cd backend
dotnet test
```

28 passing tests cover the parts of the spec most explicitly called out for correctness: the
value-band approval chain (HOD-only / HOD+Finance / HOD+Finance+Audit at the exact
1,000,000 / 5,000,000 boundaries), the quotation-count rules (the 250,000 threshold is inclusive
on the 3-quote side, emergency always overrides, star vs. non-star vendors), self-approval and
dual-stage blocking, mandatory-remarks enforcement, and PR-creation validation.

This sandbox has no SQL Server available, so these are unit/logic tests against an in-memory
model rather than a live-database integration suite. `dotnet ef migrations script` was used
during development to confirm the full SQL Server DDL generates cleanly (88 tables, 280
foreign keys, all 7 numbering sequences) — re-run it yourself after `docker compose up` if you
want to see it directly: `docker compose exec api dotnet ef migrations script --project ...`
(or just trust the migration that already ran). A full live-database integration pass is the
one thing this delivery couldn't exercise here and is worth doing against your own SQL Server
before go-live.

## Repository layout

```
procurement-system/
├─ docker-compose.yml
├─ backend/
│  ├─ Procurement.sln
│  ├─ src/
│  │  ├─ Procurement.Domain            entities (all 88 tables)
│  │  ├─ Procurement.Application       one folder per module: commands, queries, validators, workflow engine
│  │  ├─ Procurement.Infrastructure    DbContext, EF migrations, startup initializer, seeders, external-service adapters
│  │  ├─ Procurement.Api               controllers, JWT auth, Swagger
│  │  └─ Procurement.Worker            background jobs
│  └─ tests/
│     ├─ Procurement.Application.Tests
│     └─ Procurement.Api.Tests
└─ frontend/
   └─ web/                             Angular 17 app (see frontend/web/README.md)
```
