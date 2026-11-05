import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PurchasingService } from '../../../../core/services/purchasing.service';
import { ReceivingService } from '../../../../core/services/receiving.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Grn, Pr, PurchaseOrder } from '../../../../core/models';
import { RecordGrnDialogComponent } from './record-grn-dialog.component';
import { ReasonDialogComponent } from '../../../../shared/components/reason-dialog/reason-dialog.component';

@Component({
  selector: 'app-receiving-tab',
  templateUrl: './receiving-tab.component.html',
  styleUrls: ['./receiving-tab.component.scss'],
})
export class ReceivingTabComponent implements OnChanges {
  @Input() pr!: Pr;
  @Output() refresh = new EventEmitter<void>();

  purchaseOrders: PurchaseOrder[] = [];
  grns: Grn[] = [];

  constructor(
    private purchasingService: PurchasingService,
    private receivingService: ReceivingService,
    public auth: AuthService,
    private dialog: MatDialog,
  ) {}

  get isProcurement(): boolean {
    return this.auth.hasRole('PROCUREMENT');
  }

  get isRequester(): boolean {
    return this.auth.currentUser?.id === this.pr.requesterId;
  }

  hasOutstanding(po: PurchaseOrder): boolean {
    return po.lines.some((l) => l.outstandingQty > 0);
  }

  ngOnChanges(): void {
    if (this.pr) this.load();
  }

  load(): void {
    this.purchasingService.listForPr(this.pr.id).subscribe((pos) => (this.purchaseOrders = pos.filter((p) => p.poStatusCode !== 'Draft' && p.poStatusCode !== 'Issued')));
    this.receivingService.listForPr(this.pr.id).subscribe((grns) => (this.grns = grns));
  }

  recordGrn(po: PurchaseOrder): void {
    this.dialog
      .open(RecordGrnDialogComponent, { data: po, width: '620px' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.receivingService.recordGrn(po.id, result.receivedOn, result.deliveryNoteNo, result.deliveryNoteDocumentId, result.lines).subscribe(() => {
          this.load();
          this.refresh.emit();
        });
      });
  }

  ratings: Record<number, number> = {};

  acknowledge(grn: Grn, accept: boolean): void {
    if (accept) {
      const rating = this.ratings[grn.id] || 5;
      this.receivingService.acknowledge(grn.id, true, rating, null, null).subscribe(() => {
        this.load();
        this.refresh.emit();
      });
    } else {
      this.dialog
        .open(ReasonDialogComponent, { data: { title: 'Dispute delivery', label: 'Reason', required: true, confirmText: 'Dispute' } })
        .afterClosed()
        .subscribe((reason) => {
          if (reason === undefined) return;
          this.receivingService.acknowledge(grn.id, false, null, null, reason).subscribe(() => this.load());
        });
    }
  }
}
