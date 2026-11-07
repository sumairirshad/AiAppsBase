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

## Known gaps versus the backend

The backend has since closed most of the query-surface gaps an earlier frontend-only pass had to
work around. What follows is the current state: fixed items are wired to the new endpoints
(workarounds removed), and anything still genuinely missing is flagged as such.

### Fixed (new backend endpoints now wired up)

1. **Sourcing groups and quotations now have a GET.** `GET sourcing/pr/{id}/groups` returns every
   sourcing group for a PR with its lines, quotations (vendor, totals, star-vendor flag) and
   selection state. The Procurement workbench (`features/procurement/pr-workbench`) and Audit's
   quote-review screen (`features/audit/pr-detail`) both load from this endpoint instead of
   tracking command-returned ids in local component state - the workbench survives a refresh or a
   different officer picking up the same PR, and Audit can now actually see the quotes it's
   approving rather than a bare "Complete" button.
2. **Purchase orders, PO lines and contracts now have a GET, and GRN entry is built.**
   `GET purchasing/pr/{id}/orders` returns every PO for a PR with its lines (including each line's
   id and `outstandingQty`) and its contract. The workbench's PO/contract/amendment section now
   lists real POs instead of session-tracked ids, and the goods-receipt section (previously an
   explanatory notice saying this couldn't be built) is a real form: pick a PO, its
   still-outstanding lines populate with the real `poLineId`, delivered/accepted/rejected
   quantities default sensibly and are editable, and it posts to `POST receiving/orders/{poId}/grn`.
3. **A "my queries" endpoint now exists** (`GET audit/queries/mine`), listing every open query
   assigned to a role the caller holds, to them personally, or (for a Requestor) raised against
   their own PR. A shared `MyQueriesPanelComponent` backed by this endpoint is on every role's
   dashboard (Requestor, HOD, Finance, Procurement, Audit, OPD), with an inline respond box next to
   each query - no more being told a query id out of band. Since any role can now discover its own
   queries, the "Raise query" control in the shared action bar also gained a target-role dropdown
   (Requestor/HOD/Finance/Procurement/Audit/OPD) instead of always hard-coding Requestor. The
   Requestor's per-PR "respond to query" box now looks its own open query up via this endpoint
   instead of asking the user to type the query id in.
4. **`CreatePrRequest` now has a `Bill` field.** The bill-route PR wizard
   (`features/requestor/raise-pr`) was already building and sending the correct `bill` payload
   shape (billing period, amount, purpose, due date, document id, payee vendor) - that just works
   now that the backend DTO accepts it. No frontend change was needed here beyond confirming it.
5. **The generic `/act` endpoint rejecting non-approval action codes (`Complete`/`Void`/
   `Cancel`/`Skip`) is now enforced**, and the frontend has been checked against it. Audit's
   dedicated stamp endpoint (`POST audit/pr/{id}/stamp`) was already special-cased correctly. Two
   more spots relied on the old (buggy) silent-accept behavior and have been fixed:
   - The Procurement workbench's generic action bar can show a `Complete` button for any
     Operational stage it owns (accept, quotations, PO/contract, GRN, bill-forward) - every one of
     those is actually advanced by its own dedicated command above it on the same screen, so
     `Complete` is now intercepted and short-circuited to a toast pointing at the right control,
     rather than being sent to `/act`.
   - The Requestor's PR-detail screen intercepts `Complete` the same way for the ACKNOWLEDGE
     stage - that's completed through the dedicated "Acknowledge delivery" page
     (`POST receiving/pr/{id}/acknowledge`), not the generic endpoint.

6. **`GET catalog/item-requests/pending` now exists.** OPD's dashboard "Pending item / category
   requests" card lists every open request (type, proposed name, category, requester, date)
   straight from this endpoint instead of a manual "enter the request id" box, with inline
   Approve/Reject actions - rejecting still requires a reason via the shared confirm dialog, and
   approving an `Item`-type request requires picking a unit from `GET catalog/units` first
   (`POST catalog/item-requests/{id}/decision`).
7. **`POST recurring/pr/{id}/upload-bill` now exists**, so the cyclic-bill "owner upload" stage
   (`OWNER_UPLOAD`, PR status `AwaitingBill`) is no longer stuck with no screen. A dedicated
   `features/requestor/upload-bill` page (reached from the Requestor's PR-detail screen, which
   shows an "Upload this period's bill" button whenever a PR is at this stage) collects the
   billing period, amount, purpose, due date, payee vendor and bill document (via the same
   `DocumentUploadComponent` the raise-PR bill wizard uses) and posts them to this endpoint; the
   PR then moves off `AwaitingBill` in the Requestor's "my requests"/dashboard lists. The
   PR-detail screen's `Complete` intercept was extended to point at this new screen for that
   stage, the same way it already did for acknowledgement.

### Still genuinely outstanding

8. **Escalated Operational-stage tasks have no hand-off UI for OPD.** Several Operational stages
   Procurement or the Requestor own (sourcing accept, quotations, PO/contract, GRN, bill-forward,
   acknowledgement) escalate to OPD after a timeout; when that happens, OPD's generic action bar
   would offer the same context-free `Complete` button discussed above, with no OPD-facing screen
   that can actually perform the underlying work. OPD's PR-detail screen now intercepts `Complete`
   there too (so it fails safely with guidance instead of a raw 400), but picking the task up for
   real still means someone with the owning role (Procurement, or the Requestor) opens it from
   their own screen - OPD itself can only force-revert or void from its dashboard. Fixing this
   properly needs either a backend hand-off (reassign the task) or giving OPD read/write access to
   the same workbench/GRN/acknowledge screens, neither of which was in scope here.

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
