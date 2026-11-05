import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuditService } from '../../../../core/services/audit.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AuditQuery, AuditStamp, Pr } from '../../../../core/models';
import { ReasonDialogComponent } from '../../../../shared/components/reason-dialog/reason-dialog.component';

@Component({
  selector: 'app-audit-tab',
  templateUrl: './audit-tab.component.html',
  styleUrls: ['./audit-tab.component.scss'],
})
export class AuditTabComponent implements OnChanges {
  @Input() pr!: Pr;
  @Output() refresh = new EventEmitter<void>();

  stamp: AuditStamp | null = null;
  queries: AuditQuery[] = [];
  paymentVerified = false;
  deliveryVerified = false;

  constructor(private auditService: AuditService, public auth: AuthService, private dialog: MatDialog) {}

  get isAudit(): boolean {
    return this.auth.hasRole('AUDIT');
  }

  ngOnChanges(): void {
    if (this.pr) this.load();
  }

  load(): void {
    this.auditService.getStamp(this.pr.id).subscribe((stamp) => (this.stamp = stamp));
    this.auditService.listQueries('PurchaseRequisition', this.pr.id).subscribe((queries) => (this.queries = queries));
  }

  submitStamp(): void {
    this.auditService.stamp(this.pr.id, this.paymentVerified, this.deliveryVerified, null).subscribe(() => this.refresh.emit());
  }

  raiseQuery(): void {
    this.dialog
      .open(ReasonDialogComponent, { data: { title: 'Raise audit query', label: 'Query', required: true, confirmText: 'Raise' } })
      .afterClosed()
      .subscribe((queryText) => {
        if (queryText === undefined) return;
        this.auditService.raiseQuery('PurchaseRequisition', this.pr.id, 'PROCUREMENT', null, queryText).subscribe(() => this.load());
      });
  }

  respondQuery(query: AuditQuery): void {
    this.dialog
      .open(ReasonDialogComponent, { data: { title: 'Respond to query', label: 'Response', required: true, confirmText: 'Respond' } })
      .afterClosed()
      .subscribe((responseText) => {
        if (responseText === undefined) return;
        this.auditService.respondQuery(query.id, responseText, this.pr.prStatusCode).subscribe(() => {
          this.load();
          this.refresh.emit();
        });
      });
  }
}
