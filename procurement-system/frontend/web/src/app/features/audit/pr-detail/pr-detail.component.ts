import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { AuditService, BillHistoryDto } from '../../../core/services/audit.service';
import { SourcingService } from '../../../core/services/sourcing.service';
import { PrDetailDto } from '../../../core/models/requisition.models';
import { SourcingGroupDto } from '../../../core/models/sourcing.models';
import { PrDetailCoreComponent } from '../../../shared/components/pr-detail-core/pr-detail-core.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-audit-pr-detail',
  standalone: true,
  imports: [PrDetailCoreComponent, RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <p><a [routerLink]="backLink">&larr; {{ backLabel }}</a></p>
      @if (isOpdHandoff) {
        <div class="card" style="background:var(--color-surface-muted, #f6f6f6)">
          <p style="margin:0">
            <strong>Escalated to OPD.</strong> Audit did not act on this stage within its deadline, so OPD is
            completing it here on Audit's behalf.
          </p>
        </div>
      }
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
        @if (groups.length > 0) {
          <div class="card" style="background:var(--color-surface-muted, #f6f6f6)">
            <h3>Sourcing groups &amp; quotations</h3>
            @for (g of groups; track g.id) {
              <div style="margin-bottom:12px">
                <p style="margin:0 0 6px"><strong>Group {{ g.groupNo }}</strong> - amount {{ g.groupAmount | number: '1.0-2' }}, needs {{ g.requiredQuotes }} quote(s)</p>
                <table class="data">
                  <thead><tr><th>Quotation #</th><th>Vendor</th><th>Total</th><th>Comparable total</th><th>Awarded</th></tr></thead>
                  <tbody>
                    @for (q of g.quotations; track q.id) {
                      <tr>
                        <td>{{ q.quotationNo }}</td>
                        <td>{{ q.vendorName }}{{ q.isStarVendor ? ' (star)' : '' }}</td>
                        <td>{{ q.total | number: '1.0-2' }}</td>
                        <td>{{ q.comparableTotal | number: '1.0-2' }}</td>
                        <td>{{ g.selectedQuotationId === q.id ? 'Yes' : '' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if (g.selectionJustification) {
                  <p style="color:var(--color-muted)">Justification: {{ g.selectionJustification }}</p>
                }
              </div>
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
  groups: SourcingGroupDto[] = [];
  private prId = 0;

  /**
   * This same component is reused, unmodified otherwise, from an OPD-prefixed route
   * (app.routes.ts) when QUOTE_REVIEW or AUDIT_STAMP has escalated to OPD - see
   * features/opd/pr-detail. Route `data` is what tells it which role is actually acting, so the
   * generic action bar's calls go through as that role instead of being hardcoded to Audit, and
   * so the back link returns to the right dashboard.
   */
  actingRoleCode = 'AUDIT';
  backLink: any[] = ['/audit/dashboard'];
  backLabel = 'Back to audit queue';
  isOpdHandoff = false;

  constructor(private route: ActivatedRoute, private router: Router, private requisitions: RequisitionsService, private audit: AuditService, private sourcing: SourcingService, private toast: ToastService) {}

  ngOnInit(): void {
    this.prId = Number(this.route.snapshot.paramMap.get('id'));
    const data = this.route.snapshot.data as { roleCode?: string; backLink?: string; backLabel?: string };
    if (data.roleCode === 'OPD') {
      this.actingRoleCode = 'OPD';
      this.isOpdHandoff = true;
      this.backLink = [data.backLink ?? '/opd/pr', this.prId];
      this.backLabel = data.backLabel ?? 'Back to escalated PR';
    }
    this.load();
  }

  load(): void {
    this.requisitions.detail(this.prId).subscribe((pr) => {
      this.pr = pr;
      // Defends against someone navigating here by hand for a PR that was never actually
      // escalated to OPD (or whose owning role already acted): the backend's own
      // WorkflowEngine.GetAllowedActionsAsync only populates allowedActions for OPD on this
      // task when it is genuinely the escalation target.
      if (this.isOpdHandoff && pr.allowedActions.length === 0) {
        this.toast.error('This PR is not currently escalated to OPD at this stage.');
        this.router.navigate(['/opd/pr', this.prId]);
      }
    });
    this.audit.billHistory(this.prId).subscribe({
      next: (h) => (this.billHistory = h),
      error: () => (this.billHistory = null),
    });
    // Durable, so Audit's quote review (BR-026/BR-027: comparable totals, star-vendor rule,
    // selection justification) sees exactly what Procurement actually recorded.
    this.sourcing.groupsForPr(this.prId).subscribe({
      next: (groups) => (this.groups = groups),
      error: () => (this.groups = []),
    });
  }

  onAct(event: { actionCode: string; remarks?: string }): void {
    // "Complete" at the audit-stamp stage must go through the dedicated stamp endpoint - it
    // verifies full payment/delivery and writes the AuditStamps record; the generic Act
    // endpoint's Complete path does neither.
    const call = event.actionCode === 'Complete' ? this.audit.stamp(this.prId, event.remarks) : this.requisitions.act(this.prId, this.actingRoleCode, event.actionCode, event.remarks);

    call.subscribe({
      next: () => {
        this.toast.success('Done.');
        this.load();
      },
    });
  }
}
