import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SourcingService } from '../../../../core/services/sourcing.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Pr, Quotation, SourcingGroup } from '../../../../core/models';
import { ReasonDialogComponent } from '../../../../shared/components/reason-dialog/reason-dialog.component';
import { AddQuotationDialogComponent } from './add-quotation-dialog.component';

@Component({
  selector: 'app-sourcing-tab',
  templateUrl: './sourcing-tab.component.html',
  styleUrls: ['./sourcing-tab.component.scss'],
})
export class SourcingTabComponent implements OnChanges {
  @Input() pr!: Pr;
  @Output() refresh = new EventEmitter<void>();

  groups: SourcingGroup[] = [];
  quotationsByGroup: Record<number, Quotation[]> = {};

  constructor(private sourcingService: SourcingService, public auth: AuthService, private dialog: MatDialog) {}

  get isProcurement(): boolean {
    return this.auth.hasRole('PROCUREMENT');
  }

  ngOnChanges(): void {
    if (this.pr) this.loadGroups();
  }

  loadGroups(): void {
    this.sourcingService.listGroups(this.pr.id).subscribe((groups) => {
      this.groups = groups;
      groups.forEach((g) => this.loadQuotations(g.id));
    });
  }

  loadQuotations(groupId: number): void {
    this.sourcingService.listQuotations(groupId).subscribe((quotations) => (this.quotationsByGroup[groupId] = quotations));
  }

  acceptForSourcing(): void {
    this.sourcingService.acceptForSourcing(this.pr.id).subscribe(() => this.refresh.emit());
  }

  addQuotation(group: SourcingGroup): void {
    this.dialog
      .open(AddQuotationDialogComponent, { data: { pr: this.pr, prLineIds: group.prLineIds, categoryId: group.categoryId } })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.sourcingService
          .addQuotation(group.id, result.vendorId, result.quotationNo, result.quotationDate, result.documentId, result.lines)
          .subscribe(() => this.loadQuotations(group.id));
      });
  }

  completeQuotations(): void {
    this.sourcingService.completeQuotations(this.pr.id).subscribe(() => this.refresh.emit());
  }

  selectQuotation(group: SourcingGroup, quotation: Quotation): void {
    if (!quotation.isRecommended) {
      this.dialog
        .open(ReasonDialogComponent, { data: { title: 'Justify higher quote', label: 'Justification', required: true, confirmText: 'Select' } })
        .afterClosed()
        .subscribe((justification) => {
          if (justification === undefined) return;
          this.sourcingService.selectQuotation(group.id, quotation.id, justification).subscribe(() => this.loadGroups());
        });
    } else {
      this.sourcingService.selectQuotation(group.id, quotation.id, null).subscribe(() => this.loadGroups());
    }
  }

  completeQuoteReview(): void {
    this.sourcingService.completeQuoteReview(this.pr.id).subscribe(() => this.refresh.emit());
  }

  opdQuoteException(approve: boolean): void {
    this.dialog
      .open(ReasonDialogComponent, { data: { title: approve ? 'Approve high-quote exception' : 'Reject', label: 'Reason', required: true } })
      .afterClosed()
      .subscribe((reason) => {
        if (reason === undefined) return;
        this.sourcingService.opdQuoteException(this.pr.id, approve, reason).subscribe(() => this.refresh.emit());
      });
  }

  allGroupsHaveSelection(): boolean {
    return this.groups.every((g) => g.requiredQuotes === 0 || g.selectedQuotationId != null);
  }
}
