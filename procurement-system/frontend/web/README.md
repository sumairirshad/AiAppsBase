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

8. **OPD's escalation hand-off for the five Procurement-owned Operational stages
   (`PROCUREMENT_ACCEPT`, `QUOTATIONS`, `PO_CONTRACT`, `GRN`, `BILL_FORWARD`), the two
   Requester-owned ones (`ACKNOWLEDGE`, `OWNER_UPLOAD`), and the two Audit-owned ones
   (`QUOTE_REVIEW`, `AUDIT_STAMP`) is now a full fix, not just a UI path.**
   These all escalate to OPD after their `EscalationDays` timeout. OPD's PR-detail screen
   (`features/opd/pr-detail`) detects a genuinely escalated task from the PR's own
   `allowedActions` and links straight to the real action - reusing `features/procurement/pr-workbench`,
   `features/requestor/acknowledge`, `features/requestor/upload-bill` and `features/audit/pr-detail`
   unmodified in their real logic, via route-data-driven `roleCode`/`backLink`/`backLabel` inputs
   and parallel `/opd/pr/:id/...` routes - exactly as described below. This previously only got OPD
   to the screen: each stage's dedicated backend command gated itself on a plain role-permission
   code OPD never held, or (for `ACKNOWLEDGE`/`OWNER_UPLOAD`) a hard-coded "must be the requester"
   check or a hard-coded role id passed into the engine, so the write still failed even for a
   genuine escalation. The backend has since been fixed for all nine of these stages:
   `IWorkflowEngine.CanActNowAsync` plus a workflow-instance-aware `IPermissionChecker.RequireAsync`
   overload that every affected handler now calls (including `SOURCING.QUOTE_REVIEW` and
   `AUDIT.STAMP`), and `WorkflowEngine.AuthorizeAsync`'s Requester/Department/FixedDepartment scope
   checks now skip for a pure escalation actor (with a regression test in
   `WorkflowEngineTests.cs` covering exactly this). A single-role OPD account can now genuinely
   complete any of these nine stages once the task has actually escalated to them.
   - For the five Procurement-owned stages, OPD's PR-detail links to a new `/opd/pr/:id/workbench`
     route that reuses `features/procurement/pr-workbench` **unchanged**, just reached a different
     way: the component reads `roleCode`/`backLink`/`backLabel` off the route's `data` (defaulted
     to Procurement's own values, so `/procurement/pr/:id` behaves exactly as before) instead of
     hard-coding `'PROCUREMENT'` and `/procurement/dashboard`, and shows an "Escalated to OPD"
     banner when reached that way.
   - For `ACKNOWLEDGE` and `OWNER_UPLOAD`, it links to new `/opd/pr/:id/acknowledge` and
     `/opd/pr/:id/upload-bill` routes reusing `features/requestor/acknowledge` and
     `features/requestor/upload-bill` the same way.
   - For `QUOTE_REVIEW` (PR status `PendingQuoteReview`) and `AUDIT_STAMP` (PR status
     `AuditReview`), it links to a new `/opd/pr/:id/audit-review` route reusing
     `features/audit/pr-detail` the same way: the component reads `roleCode`/`backLink`/`backLabel`
     off the route's `data` (defaulted to Audit's own values, so `/audit/pr/:id` behaves exactly as
     before) instead of hard-coding `'AUDIT'` and `/audit/dashboard`, and shows the same
     "Escalated to OPD" banner. The generic action bar's calls (e.g. the quote-review
     accept/reject) go through as the acting role from route data; the audit stamp's `Complete`
     still always goes through the dedicated `POST audit/pr/{id}/stamp` endpoint regardless of
     which role is acting, since that endpoint - not the generic `/act` endpoint - is what
     actually verifies payment/delivery and writes the audit stamp.
   - All reused screens re-check `allowedActions` for themselves on load when reached via the OPD
     route, and bounce back to `/opd/pr/:id` with a toast if the PR turns out not to be genuinely
     escalated - so this only ever opens for a real escalation, never a casual "OPD does another
     role's job" shortcut.
   - These are new, parallel, OPD-prefixed routes under the existing `roleGuard('OPD')` - the
     Procurement/Requestor/Audit routes and their guards are untouched.

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
