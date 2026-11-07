import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { AuditService } from '../../../core/services/audit.service';
import { InboxTableComponent } from '../../../shared/components/inbox-table/inbox-table.component';
import { MyQueriesPanelComponent } from '../../../shared/components/my-queries-panel/my-queries-panel.component';
import { ToastService } from '../../../shared/services/toast.service';
import { PrListItemDto } from '../../../core/models/requisition.models';

@Component({
  selector: 'app-audit-dashboard',
  standalone: true,
  imports: [FormsModule, InboxTableComponent, MyQueriesPanelComponent],
  template: `
    <div class="page">
      <h2>Audit</h2>

      <div class="card">
        <h3>Jump to a PR</h3>
        <div class="actions-row">
          <input type="number" min="1" [(ngModel)]="jumpId" style="max-width:160px" placeholder="PR id" />
          <button type="button" class="btn btn-secondary" [disabled]="!jumpId" (click)="jump()">Open</button>
        </div>
      </div>

      <div class="card">
        <h3>Pending your review</h3>
        <app-inbox-table [items]="inbox" emptyMessage="No PRs waiting on you." detailRoute="/audit/pr"></app-inbox-table>
      </div>

      <app-my-queries-panel detailRoute="/audit/pr"></app-my-queries-panel>

      <div class="card">
        <h3>Month-end audit</h3>
        <div class="form-grid">
          <div class="field">
            <label>Period (e.g. 2026-01)</label>
            <input type="text" [(ngModel)]="period" />
          </div>
        </div>
        <div class="actions-row">
          <button type="button" class="btn btn-primary" [disabled]="!period.trim()" (click)="startMonthEnd()">Start month-end audit</button>
        </div>

        @if (openMonthEndId) {
          <div class="field" style="margin-top:12px">
            <label>Summary for audit #{{ openMonthEndId }} (optional)</label>
            <textarea rows="2" [(ngModel)]="monthEndSummary"></textarea>
            <button type="button" class="btn btn-secondary" style="margin-top:8px;width:fit-content" (click)="completeMonthEnd()">Complete month-end audit</button>
          </div>
        }
      </div>
    </div>
  `,
})
export class AuditDashboardComponent implements OnInit {
  inbox: PrListItemDto[] = [];
  jumpId: number | null = null;
  period = '';
  openMonthEndId: number | null = null;
  monthEndSummary = '';

  constructor(private requisitions: RequisitionsService, private audit: AuditService, private toast: ToastService, private router: Router) {}

  ngOnInit(): void {
    this.requisitions.inbox('AUDIT').subscribe((items) => (this.inbox = items));
  }

  jump(): void {
    if (this.jumpId) this.router.navigate(['/audit/pr', this.jumpId]);
  }

  startMonthEnd(): void {
    this.audit.startMonthEnd(this.period.trim()).subscribe((id) => {
      this.openMonthEndId = id;
      this.toast.success(`Month-end audit #${id} started.`);
    });
  }

  completeMonthEnd(): void {
    if (!this.openMonthEndId) return;
    this.audit.completeMonthEnd(this.openMonthEndId, this.monthEndSummary.trim() || undefined).subscribe(() => {
      this.toast.success('Month-end audit completed.');
      this.openMonthEndId = null;
      this.monthEndSummary = '';
      this.period = '';
    });
  }
}
