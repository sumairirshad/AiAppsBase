import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { AuditService, BillHistoryDto } from '../../../core/services/audit.service';
import { PrDetailDto } from '../../../core/models/requisition.models';
import { PrDetailCoreComponent } from '../../../shared/components/pr-detail-core/pr-detail-core.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-audit-pr-detail',
  standalone: true,
  imports: [PrDetailCoreComponent, RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <p><a routerLink="/audit/dashboard">&larr; Back to audit queue</a></p>
      <app-pr-detail-core [pr]="pr" (act)="onAct($event)" (queried)="load()">
        @if (billHistory) {
          <div class="card" style="background:var(--color-surface-muted, #f6f6f6)">
            <h3>Spend history</h3>
            <p>Current amount: {{ billHistory.currentAmount | number: '1.0-2' }}</p>
            @if (billHistory.lastYearAmounts.length) {
              <p>Same period last year: {{ billHistory.lastYearAmounts.join(', ') }} (average {{ billHistory.average | number: '1.0-2' }})</p>
            }
            @if (billHistory.looksUnusual) {
              <p class="warning-badge">This amount looks unusual compared to history.</p>
            }
          </div>
        }
        @if (pr && pr.allowedActions.includes('Complete')) {
          <p style="color:var(--color-muted)">
            "Complete" here performs the audit stamp: it verifies the PR is fully paid and fully received before
            closing it, and records the audit stamp event.
          </p>
        }
      </app-pr-detail-core>
    </div>
  `,
})
export class AuditPrDetailComponent implements OnInit {
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
    // "Complete" at the audit-stamp stage must go through the dedicated stamp endpoint - it
    // verifies full payment/delivery and writes the AuditStamps record; the generic Act
    // endpoint's Complete path does neither.
    const call = event.actionCode === 'Complete' ? this.audit.stamp(this.prId, event.remarks) : this.requisitions.act(this.prId, 'AUDIT', event.actionCode, event.remarks);

    call.subscribe({
      next: () => {
        this.toast.success('Done.');
        this.load();
      },
    });
  }
}
