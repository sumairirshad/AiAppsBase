import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BillsService } from '../../../../core/services/bills.service';
import { PurchasingService } from '../../../../core/services/purchasing.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Pr, PurchaseOrder, SupplierInvoice } from '../../../../core/models';
import { UploadBillDialogComponent } from './upload-bill-dialog.component';

@Component({
  selector: 'app-bills-tab',
  templateUrl: './bills-tab.component.html',
  styleUrls: ['./bills-tab.component.scss'],
})
export class BillsTabComponent implements OnChanges {
  @Input() pr!: Pr;
  @Output() refresh = new EventEmitter<void>();

  bills: SupplierInvoice[] = [];
  purchaseOrders: PurchaseOrder[] = [];

  constructor(private billsService: BillsService, private purchasingService: PurchasingService, public auth: AuthService, private dialog: MatDialog) {}

  get isProcurement(): boolean {
    return this.auth.hasRole('PROCUREMENT');
  }

  ngOnChanges(): void {
    if (this.pr) this.load();
  }

  load(): void {
    this.billsService.listForPr(this.pr.id).subscribe((bills) => (this.bills = bills));
    this.purchasingService.listForPr(this.pr.id).subscribe((pos) => (this.purchaseOrders = pos));
  }

  uploadBill(): void {
    this.dialog
      .open(UploadBillDialogComponent, { data: { pr: this.pr, purchaseOrders: this.purchaseOrders } })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.billsService.upload(this.pr.id, result.poId, result.vendorId, result.vendorInvoiceRef, result.invoiceDate, result.total, result.documentId).subscribe(() => this.load());
      });
  }

  forward(bill: SupplierInvoice): void {
    this.billsService.forward(bill.id).subscribe(() => this.load());
  }

  canCompleteBillUpload(): boolean {
    return this.bills.length > 0 && this.bills.every((b) => b.billStatus !== 'Uploaded');
  }

  completeBillUpload(): void {
    this.billsService.completeBillUpload(this.pr.id).subscribe(() => this.refresh.emit());
  }

  simulatePayment(): void {
    this.billsService.simulateFinancePortalPayment(this.pr.id).subscribe(() => this.refresh.emit());
  }
}
