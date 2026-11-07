import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { PrDetailDto } from '../../../core/models/requisition.models';
import { PrDetailCoreComponent } from '../../../shared/components/pr-detail-core/pr-detail-core.component';
import { ToastService } from '../../../shared/services/toast.service';

interface EscalatedOperationalAction {
  route: any[];
  label: string;
  description: string;
}

/**
 * Operational stages that escalate to OPD after their EscalationDays timeout, keyed by the PR
 * status code each one sits at while open (WorkflowSeeder.cs), mapped to the OPD-prefixed route
 * that reuses the owning role's own screen for the real action - see app.routes.ts.
 *
 * `allowedActions` on the PR-detail response is the actual escalation signal: for OPD, the
 * backend's WorkflowEngine only returns a non-empty list on an Operational-stage task when
 * either OPD is "mine" (never true for these stages - OPD owns none of them directly) or OPD is
 * the task's real EscalatedToRoleId, i.e. GetAllowedActionsAsync's `isEscalationTarget` check
 * (WorkflowEngine.cs) actually passed server-side. So gating on that - not on OPD's role alone -
 * is what keeps this from offering these actions on a PR that hasn't genuinely escalated yet.
 */
const OPERATIONAL_STAGE_ROUTES: Record<string, (prId: number) => EscalatedOperationalAction> = {
  PendingProcurement: (id) => ({
    route: ['/opd/pr', id, 'workbench'],
    label: 'Accept for sourcing',
    description: 'PROCUREMENT_ACCEPT has escalated to OPD - accept this PR for sourcing and group its lines.',
  }),
  PendingQuotations: (id) => ({
    route: ['/opd/pr', id, 'workbench'],
    label: 'Sourcing workbench (quotations)',
    description: 'QUOTATIONS has escalated to OPD - enter quotations against each sourcing group and select the winner.',
  }),
  PoPreparation: (id) => ({
    route: ['/opd/pr', id, 'workbench'],
    label: 'Create purchase order / contract',
    description: 'PO_CONTRACT has escalated to OPD - create the purchase order(s) and generate/activate the contract.',
  }),
  PoIssued: (id) => ({
    route: ['/opd/pr', id, 'workbench'],
    label: 'Record goods receipt (GRN)',
    description: 'GRN has escalated to OPD - record the goods receipt against the outstanding PO line(s).',
  }),
  BillPending: (id) => ({
    route: ['/opd/pr', id, 'workbench'],
    label: 'Forward bill to Finance',
    description: 'BILL_FORWARD has escalated to OPD - upload/forward the vendor bill to the Finance Portal.',
  }),
  AwaitingAcknowledgement: (id) => ({
    route: ['/opd/pr', id, 'acknowledge'],
    label: 'Acknowledge delivery',
    description: 'ACKNOWLEDGE has escalated to OPD - confirm delivery (or dispute it) on the requestor’s behalf.',
  }),
  AwaitingBill: (id) => ({
    route: ['/opd/pr', id, 'upload-bill'],
    label: "Upload this period's bill",
    description: "OWNER_UPLOAD has escalated to OPD - enter this period's billing details on the plan owner’s behalf.",
  }),
};

@Component({
  selector: 'app-opd-pr-detail',
  standalone: true,
  imports: [PrDetailCoreComponent, RouterLink],
  template: `
    <div class="page">
      <p><a routerLink="/opd/dashboard">&larr; Back to OPD queue</a></p>
      <app-pr-detail-core [pr]="pr" (act)="onAct($event)" (queried)="load()">
        @if (escalatedAction) {
          <div class="card" style="background:var(--color-surface-muted, #f6f6f6)">
            <h4 style="margin-top:0">Escalated to OPD</h4>
            <p style="color:var(--color-muted)">{{ escalatedAction.description }}</p>
            <a class="btn btn-primary" [routerLink]="escalatedAction.route">{{ escalatedAction.label }}</a>
          </div>
        }
      </app-pr-detail-core>
    </div>
  `,
})
export class OpdPrDetailComponent implements OnInit {
  pr: PrDetailDto | null = null;
  private prId = 0;

  constructor(private route: ActivatedRoute, private requisitions: RequisitionsService, private toast: ToastService) {}

  ngOnInit(): void {
    this.prId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  /**
   * Non-null only when the open task is a known Operational stage AND the backend has actually
   * authorized OPD to act on it (allowedActions non-empty) - i.e. a genuine escalation, not just
   * OPD happening to be looking at someone else's PR.
   */
  get escalatedAction(): EscalatedOperationalAction | null {
    if (!this.pr || this.pr.allowedActions.length === 0) return null;
    const factory = OPERATIONAL_STAGE_ROUTES[this.pr.statusCode];
    return factory ? factory(this.prId) : null;
  }

  load(): void {
    this.requisitions.detail(this.prId).subscribe((pr) => (this.pr = pr));
  }

  onAct(event: { actionCode: string; remarks?: string }): void {
    if (event.actionCode === 'Complete') {
      if (this.escalatedAction) {
        // Same guidance as the card above, in case someone clicks the generic bar's button
        // instead of the dedicated one.
        this.toast.error(`Use "${this.escalatedAction.label}" above - it performs the actual work and advances the PR.`);
      } else {
        // Escalated to OPD at a stage this screen has no dedicated hand-off for (e.g. Audit's
        // closure stamp) - OPD's own tools here are force-revert/void from its dashboard.
        this.toast.error('This stage needs its own screen, which OPD has no hand-off for yet - use force-revert/void from the dashboard if it is stuck.');
      }
      return;
    }
    this.requisitions.act(this.prId, 'OPD', event.actionCode, event.remarks).subscribe(() => {
      this.toast.success('Done.');
      this.load();
    });
  }
}
