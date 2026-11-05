import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RequisitionService } from '../../../core/services/requisition.service';
import { AuthService } from '../../../core/services/auth.service';
import { Pr, PrTimelineEntry } from '../../../core/models';
import { ReasonDialogComponent } from '../../../shared/components/reason-dialog/reason-dialog.component';
import { FinanceApproveDialogComponent } from './finance-approve-dialog.component';

@Component({
  selector: 'app-requisition-detail',
  templateUrl: './requisition-detail.component.html',
  styleUrls: ['./requisition-detail.component.scss'],
})
export class RequisitionDetailComponent implements OnInit {
  pr: Pr | null = null;
  timeline: PrTimelineEntry[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requisitionService: RequisitionService,
    public auth: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  get prId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  get myRoleCodes(): string[] {
    return this.auth.currentUser?.roles.map((r) => r.roleCode) ?? [];
  }

  get canActOnDecisionGate(): boolean {
    if (!this.pr?.currentStageRoleCode) return false;
    return this.myRoleCodes.includes(this.pr.currentStageRoleCode) && ['HOD', 'FINANCE', 'AUDIT', 'OPD'].includes(this.pr.currentStageRoleCode);
  }

  get gateKind(): 'hod' | 'finance' | 'opd-budget' | 'audit' | null {
    const stage = this.pr?.currentStageCode;
    const role = this.pr?.currentStageRoleCode;
    if (!stage || !role) return null;
    if (stage === 'OPD_BUDGET_EXCEPTION') return 'opd-budget';
    if (role === 'FINANCE') return 'finance';
    if (role === 'HOD') return 'hod';
    if (role === 'AUDIT' && (stage === 'AUDIT_APPROVAL' || stage === 'AUDIT_BILL_REVIEW')) return 'audit';
    return null;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.requisitionService.get(this.prId).subscribe((pr) => {
      this.pr = pr;
      this.loading = false;
    });
    this.requisitionService.timeline(this.prId).subscribe((entries) => (this.timeline = entries));
  }

  submitForApproval(): void {
    this.requisitionService.submit(this.prId).subscribe(() => this.load());
  }

  approve(): void {
    this.requisitionService.approve(this.prId, null).subscribe(() => this.load());
  }

  reject(): void {
    this.dialog
      .open(ReasonDialogComponent, { data: { title: 'Reject purchase requisition', label: 'Reason', required: true, confirmText: 'Reject' } })
      .afterClosed()
      .subscribe((reason) => {
        if (reason === undefined) return;
        this.requisitionService.reject(this.prId, reason).subscribe(() => this.load());
      });
  }

  return(): void {
    this.dialog
      .open(ReasonDialogComponent, { data: { title: 'Return for correction', label: 'Reason', required: true, confirmText: 'Return' } })
      .afterClosed()
      .subscribe((reason) => {
        if (reason === undefined) return;
        this.requisitionService.return(this.prId, reason).subscribe(() => this.load());
      });
  }

  financeApprove(): void {
    this.dialog
      .open(FinanceApproveDialogComponent)
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.requisitionService.financeApprove(this.prId, result.budgetRef, result.availableAmount, result.remarks).subscribe(() => this.load());
      });
  }

  opdBudgetDecision(approve: boolean): void {
    this.dialog
      .open(ReasonDialogComponent, { data: { title: approve ? 'Approve over-budget exception' : 'Reject', label: 'Reason', required: true } })
      .afterClosed()
      .subscribe((reason) => {
        if (reason === undefined) return;
        this.requisitionService.opdBudgetException(this.prId, approve, reason).subscribe(() => this.load());
      });
  }
}
