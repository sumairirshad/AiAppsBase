# Procurement System - Frontend (Angular 17)

Angular 17 standalone-component SPA consuming the .NET 8 backend in `../../backend`. No NgModules,
functional interceptors/guards, signal-based state for auth/toasts.

## Running locally

```bash
npm install
npm start          # ng serve, http://localhost:4200
```

The API base URL is `src/environments/environment.development.ts` (`http://localhost:5000/api/v1` by
default) for `ng serve`, and `environment.ts` for production builds. Change either file's
`apiBaseUrl` if the backend runs on a different host/port - nothing else in the app hardcodes it.

## Building

```bash
npm run build       # production build, output in dist/web
```

## Demo accounts

Every seeded demo account uses the password `Passw0rd!1`. The login screen's "Show demo accounts"
list fills the form for any of them: Requestor, HOD (IT), Procurement HOD, Procurement, Finance,
Audit, OPD, and the System Administrator.

## Structure

- `src/app/core` - auth (JWT, signal-based session), HTTP interceptors, route guards, one thin
  service per backend module, and the DTO models mirrored from the backend's own request/response
  records.
- `src/app/shared` - cross-role building blocks: the toast queue, the one generic modal/dialog
  service, the PR inbox table, the `allowedActions[]`-driven action bar, the shared PR-detail
  shell, the document-upload and star-rating widgets.
- `src/app/features/<role>` - one folder per role area (requestor, hod, procurement, finance,
  audit, opd, admin), lazy-loaded and gated by `roleGuard`. A user holding several roles (e.g. a
  department HOD who is also a Requestor) sees every area they hold in the top nav and can switch
  between them freely; what they can actually do inside each screen is still decided by the API.

## Known gaps versus the backend (frontend-only build, backend not modified)

This build's brief was frontend-only - the backend was treated as fixed, read-only reference. A
few of its endpoints are commands with no matching query, which this UI had to work around rather
than fix. Flagging them here rather than hiding them behind code that looks like it works:

1. **No GET endpoints for sourcing groups, quotations, purchase orders, PO lines, or contracts.**
   `POST sourcing/pr/{id}/accept`, `POST sourcing/groups/{id}/quotations`,
   `POST purchasing/pr/{id}/orders`, etc. each return only a bare id (or list of ids); there is no
   way to look a group, quotation, PO, or PO line back up later by that id. The Procurement
   workbench (`features/procurement/pr-workbench`) works around this by tracking every id a
   command returns in the component's own memory for the length of one browser session - accept,
   quote, select, create PO, generate/activate contract, and bill all chain through that one
   screen. If the officer navigates away before finishing, anything not yet acted on needs the
   noted-down id entered again; there is nowhere to browse it back up.
2. **Goods receipt (GRN) entry could not be built at all**, for the same reason as #1 but with no
   workaround available: `RecordGrnRequest` needs each PO line's internal id, and nothing returns
   or exposes PO line ids anywhere (`POST purchasing/pr/{id}/orders` returns PO ids, not PO line
   ids). Guessing at identity values to satisfy a foreign key was not an acceptable substitute, so
   the workbench shows an explanatory notice in that section instead of a form that would write to
   the wrong row. **Fix needed on the backend**: a `GET purchasing/orders/{poId}` (or similar)
   returning the PO's lines with their ids.
3. **No "list my open queries" endpoint.** Raising a query (`POST audit/pr/{id}/queries`) returns
   the new query's id, but nothing lists open queries assigned to a role or user, so the only way
   to discover a query id to respond to is being told it directly. The shared action bar's "Raise
   query" button therefore always targets the Requestor (by far the most common case) and toasts
   the raiser the query id to pass on; the Requestor's PR-detail screen has a "respond to query"
   box that takes that id directly. Raising a query against a different role, or recovering a
   query id without being told it, isn't possible from this UI.
4. **No "list pending item/category requests" endpoint**, so OPD's item/category-request decision
   (`POST catalog/item-requests/{id}/decision`) is a manual "enter the request id" box on the OPD
   dashboard rather than a queue, the same pattern as #3.
5. **`CreatePrRequest` on the backend has no `Bill` field** even though the PR-creation command it
   maps to accepts one - so the bill-route PR wizard (On-Usage/As-Policy claims) builds and sends
   the correct `bill` payload shape, but the backend's own request record will silently drop it
   until that field is added there. Not something a frontend-only build can fix.
6. **"Complete" at the audit-stamp stage needed special-casing.** The generic
   `POST requisitions/{id}/act` endpoint accepts `Complete` at any stage, including the
   audit-stamp one, but it does not run the payment/delivery verification or write the audit-stamp
   record that `POST audit/pr/{id}/stamp` does - those are two different code paths for what looks
   like the same button. The Audit PR-detail screen always calls the dedicated stamp endpoint when
   the action is `Complete`; every other role's generic action bar still uses the plain `act`
   endpoint, since none of their own `Complete`-type stages have an equivalent dedicated endpoint.

None of the above required or received any change to the backend - each is a frontend decision
about how to present a real gap in the API's query surface, documented here so it isn't mistaken
for an oversight.

## Simplifications (by design, not gaps)

- The generic `ModalService`/`ModalHostComponent` is reused for every confirm/mandatory-reason
  prompt and the acknowledgement rating flow; multi-step forms (raise PR, vendor registration, the
  Procurement sourcing workbench, recurring plan setup) are full routed pages rather than modals,
  since a wizard that size doesn't belong in a dialog.
- Document uploads go through the one `DocumentUploadComponent` everywhere a `documentId` is
  needed (quotations, signed contracts, security cheques, bills), rather than a bespoke uploader
  per screen.
- `createOrders`'s `idempotencyKey` is generated client-side with `crypto.randomUUID()` on every
  call, matching what the backend's idempotency check expects.
