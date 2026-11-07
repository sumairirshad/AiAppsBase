import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { AuditService, BillHistoryDto } from '../../../core/services/audit.service';
import { PrDetailDto } from '../../../core/models/requisition.models';
import { PrDetailCoreComponent } from '../../../shared/components/pr-detail-core/pr-detail-core.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-finance-pr-detail',
  standalone: true,
  imports: [PrDetailCoreComponent, RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <p><a routerLink="/finance/dashboard">&larr; Back to approvals</a></p>
      <app-pr-detail-core [pr]="pr" (act)="onAct($event)" (queried)="load()">
        @if (billHistory) {
          <div class="card" style="background:var(--color-surface-muted, #f6f6f6)">
            <h3>Spend history</h3>
            <p>Current amount: {{ billHistory.currentAmount | number: '1.0-2' }}</p>
            @if (billHistory.lastYearAmounts.length) {
              <p>Same period last year: {{ billHistory.lastYearAmounts.join(', ') }} (average {{ billHistory.average | number: '1.0-2' }})</p>
            }
            @if (billHistory.looksUnusual) {
              <p class="warning-badge">This amount looks unusual compared to history - double check before approving.</p>
            }
          </div>
        }
      </app-pr-detail-core>
    </div>
  `,
})
export class FinancePrDetailComponent implements OnInit {
  pr: PrDetailDto | null = null;
  billHistory: BillHistoryDto | null = null;
  private prId = 0;

  constructor(private route: ActivatedRoute, private requisitions: RequisitionsService, private audit: AuditService, private toast: ToastService) {}

  ngOnInit(): void {
    this.prId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.requisitions.detail(this.prId).subscribe((pr) => (this.pr = pr));
    this.audit.billHistory(this.prId).subscribe({
      next: (h) => (this.billHistory = h),
      error: () => (this.billHistory = null),
    });
  }

  onAct(event: { actionCode: string; remarks?: string }): void {
    this.requisitions.act(this.prId, 'FINANCE', event.actionCode, event.remarks).subscribe(() => {
      this.toast.success('Done.');
      this.load();
    });
  }
}
