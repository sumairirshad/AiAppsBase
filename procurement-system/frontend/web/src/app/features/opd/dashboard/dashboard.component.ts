import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { InboxTableComponent } from '../../../shared/components/inbox-table/inbox-table.component';
import { ModalService } from '../../../shared/services/modal.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PrListItemDto } from '../../../core/models/requisition.models';

@Component({
  selector: 'app-opd-dashboard',
  standalone: true,
  imports: [FormsModule, InboxTableComponent, RouterLink],
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
        <h3>New item / category request decision</h3>
        <p style="color:var(--color-muted)">Enter the request id a requestor was given when they proposed a new item or category.</p>
        <div class="form-grid">
          <div class="field">
            <label>Request id</label>
            <input type="number" min="1" [(ngModel)]="itemRequestId" />
          </div>
          <div class="field">
            <label>Unit (required if approving a new item)</label>
            <select [(ngModel)]="itemRequestUnitId">
              <option [ngValue]="null">-</option>
              @for (u of units; track u.id) {
                <option [ngValue]="u.id">{{ u.name }}</option>
              }
            </select>
          </div>
        </div>
        <div class="actions-row">
          <button type="button" class="btn btn-primary" [disabled]="!itemRequestId" (click)="decideItemRequest(true)">Approve</button>
          <button type="button" class="btn btn-danger" [disabled]="!itemRequestId" (click)="decideItemRequest(false)">Reject</button>
        </div>
      </div>
    </div>
  `,
})
export class OpdDashboardComponent implements OnInit {
  inbox: PrListItemDto[] = [];
  jumpId: number | null = null;
  forceVoidPrId: number | null = null;
  itemRequestId: number | null = null;
  itemRequestUnitId: number | null = null;
  units: { id: number; name: string }[] = [];

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

  async decideItemRequest(approve: boolean): Promise<void> {
    if (!this.itemRequestId) return;
    let reason: string | undefined;
    if (!approve) {
      const result = await this.modal.confirm({ title: 'Reject item/category request', requireReason: true, reasonLabel: 'Reason (mandatory)', confirmLabel: 'Reject' });
      if (typeof result !== 'string' || !result.trim()) return;
      reason = result.trim();
    }
    this.catalog.decideItemRequest(this.itemRequestId, approve, reason, this.itemRequestUnitId ?? undefined).subscribe(() => {
      this.toast.success(approve ? 'Request approved.' : 'Request rejected.');
      this.itemRequestId = null;
      this.itemRequestUnitId = null;
    });
  }
}
