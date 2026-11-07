import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { InboxTableComponent } from '../../../shared/components/inbox-table/inbox-table.component';
import { MyQueriesPanelComponent } from '../../../shared/components/my-queries-panel/my-queries-panel.component';
import { ModalService } from '../../../shared/services/modal.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PrListItemDto } from '../../../core/models/requisition.models';
import { ItemRequestDto, UnitDto } from '../../../core/models/catalog.models';

@Component({
  selector: 'app-opd-dashboard',
  standalone: true,
  imports: [FormsModule, InboxTableComponent, RouterLink, MyQueriesPanelComponent, DatePipe],
  template: `
    <div class="page">
      <h2>Office of the Procurement Director</h2>

      <div class="actions-row">
        <a routerLink="/opd/policy" class="btn btn-secondary">Policy administration</a>
        <a routerLink="/opd/catalog" class="btn btn-secondary">Catalog &amp; org administration</a>
        <a routerLink="/opd/recurring" class="btn btn-secondary">Recurring plans</a>
      </div>

      <div class="card">
        <h3>Jump to a PR</h3>
        <div class="actions-row">
          <input type="number" min="1" [(ngModel)]="jumpId" style="max-width:160px" placeholder="PR id" />
          <button type="button" class="btn btn-secondary" [disabled]="!jumpId" (click)="jump()">Open</button>
        </div>
      </div>

      <div class="card">
        <h3>Pending your approval (policy referrals / higher-quote exceptions)</h3>
        <app-inbox-table [items]="inbox" emptyMessage="No PRs waiting on you." detailRoute="/opd/pr"></app-inbox-table>
      </div>

      <app-my-queries-panel detailRoute="/opd/pr"></app-my-queries-panel>

      <div class="card">
        <h3>Force-revert or void a PR</h3>
        <p style="color:var(--color-muted)">BR-048: OPD can send any PR back a stage, or void it outright, with a mandatory reason.</p>
        <div class="actions-row">
          <input type="number" min="1" [(ngModel)]="forceVoidPrId" style="max-width:160px" placeholder="PR id" />
          <button type="button" class="btn btn-secondary" [disabled]="!forceVoidPrId" (click)="forceRevert()">Force-revert</button>
          <button type="button" class="btn btn-danger" [disabled]="!forceVoidPrId" (click)="voidPr()">Void</button>
        </div>
      </div>

      <div class="card">
        <h3>Pending item / category requests</h3>
        @if (itemRequests.length === 0) {
          <div class="empty-state">No pending item or category requests.</div>
        } @else {
          <table class="data">
            <thead>
              <tr>
                <th>Type</th>
                <th>Proposed name</th>
                <th>Category</th>
                <th>Requested by</th>
                <th>Requested on</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (r of itemRequests; track r.id) {
                <tr>
                  <td>{{ r.requestType }}</td>
                  <td>{{ r.proposedName }}</td>
                  <td>{{ r.categoryName ?? '-' }}</td>
                  <td>{{ r.requestedByName }}</td>
                  <td>{{ r.createdAt | date: 'short' }}</td>
                  <td>
                    <div class="actions-row" style="flex-wrap:wrap">
                      @if (r.requestType === 'Item') {
                        <select [(ngModel)]="itemRequestUnits[r.id]" style="max-width:140px">
                          <option [ngValue]="null">Unit...</option>
                          @for (u of units; track u.id) {
                            <option [ngValue]="u.id">{{ u.name }}</option>
                          }
                        </select>
                      }
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        [disabled]="r.requestType === 'Item' && !itemRequestUnits[r.id]"
                        (click)="decideItemRequest(r, true)"
                      >
                        Approve
                      </button>
                      <button type="button" class="btn btn-danger btn-sm" (click)="decideItemRequest(r, false)">Reject</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
})
export class OpdDashboardComponent implements OnInit {
  inbox: PrListItemDto[] = [];
  jumpId: number | null = null;
  forceVoidPrId: number | null = null;
  itemRequests: ItemRequestDto[] = [];
  itemRequestUnits: Record<number, number | null> = {};
  units: UnitDto[] = [];

  constructor(
    private requisitions: RequisitionsService,
    private catalog: CatalogService,
    private modal: ModalService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.requisitions.inbox('OPD').subscribe((items) => (this.inbox = items));
    this.catalog.units().subscribe((u) => (this.units = u));
    this.loadItemRequests();
  }

  loadItemRequests(): void {
    this.catalog.pendingItemRequests().subscribe((r) => (this.itemRequests = r));
  }

  jump(): void {
    if (this.jumpId) this.router.navigate(['/opd/pr', this.jumpId]);
  }

  async forceRevert(): Promise<void> {
    if (!this.forceVoidPrId) return;
    const reason = await this.modal.confirm({ title: 'Force-revert PR', requireReason: true, reasonLabel: 'Reason (mandatory)', confirmLabel: 'Force-revert' });
    if (typeof reason !== 'string' || !reason.trim()) return;
    this.requisitions.forceRevert(this.forceVoidPrId, reason.trim()).subscribe(() => {
      this.toast.success('PR force-reverted.');
      this.forceVoidPrId = null;
    });
  }

  async voidPr(): Promise<void> {
    if (!this.forceVoidPrId) return;
    const reason = await this.modal.confirm({ title: 'Void PR', requireReason: true, reasonLabel: 'Reason (mandatory)', confirmLabel: 'Void' });
    if (typeof reason !== 'string' || !reason.trim()) return;
    this.requisitions.voidPr(this.forceVoidPrId, reason.trim()).subscribe(() => {
      this.toast.success('PR voided.');
      this.forceVoidPrId = null;
    });
  }

  async decideItemRequest(request: ItemRequestDto, approve: boolean): Promise<void> {
    let reason: string | undefined;
    if (!approve) {
      const result = await this.modal.confirm({ title: 'Reject item/category request', requireReason: true, reasonLabel: 'Reason (mandatory)', confirmLabel: 'Reject' });
      if (typeof result !== 'string' || !result.trim()) return;
      reason = result.trim();
    }
    const unitId = request.requestType === 'Item' ? this.itemRequestUnits[request.id] ?? undefined : undefined;
    this.catalog.decideItemRequest(request.id, approve, reason, unitId ?? undefined).subscribe(() => {
      this.toast.success(approve ? 'Request approved.' : 'Request rejected.');
      delete this.itemRequestUnits[request.id];
      this.loadItemRequests();
    });
  }
}
