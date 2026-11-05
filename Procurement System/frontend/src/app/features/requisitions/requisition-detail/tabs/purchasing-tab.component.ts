import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PurchasingService } from '../../../../core/services/purchasing.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Pr, PurchaseOrder } from '../../../../core/models';
import { CreatePoDialogComponent } from './create-po-dialog.component';
import { DocumentService } from '../../../../core/services/document.service';

@Component({
  selector: 'app-purchasing-tab',
  templateUrl: './purchasing-tab.component.html',
  styleUrls: ['./purchasing-tab.component.scss'],
})
export class PurchasingTabComponent implements OnChanges {
  @Input() pr!: Pr;
  @Output() refresh = new EventEmitter<void>();

  purchaseOrders: PurchaseOrder[] = [];
  chequeForms: Record<number, { signedDocumentId: number | null; chequeNo: string; chequeBank: string; chequeAmount: number | null; chequeDocumentId: number | null }> = {};

  constructor(private purchasingService: PurchasingService, public auth: AuthService, private dialog: MatDialog, public documentService: DocumentService) {}

  get isProcurement(): boolean {
    return this.auth.hasRole('PROCUREMENT');
  }

  ngOnChanges(): void {
    if (this.pr) this.load();
  }

  load(): void {
    this.purchasingService.listForPr(this.pr.id).subscribe((pos) => {
      this.purchaseOrders = pos;
      pos.forEach((po) => {
        if (!this.chequeForms[po.id]) {
          this.chequeForms[po.id] = { signedDocumentId: null, chequeNo: '', chequeBank: '', chequeAmount: null, chequeDocumentId: null };
        }
      });
    });
  }

  createPurchaseOrders(): void {
    this.dialog
      .open(CreatePoDialogComponent, { data: this.pr, width: '600px' })
      .afterClosed()
      .subscribe((purchaseOrders) => {
        if (!purchaseOrders) return;
        this.purchasingService.createPurchaseOrders(this.pr.id, purchaseOrders).subscribe(() => {
          this.load();
          this.refresh.emit();
        });
      });
  }

  issueContract(po: PurchaseOrder): void {
    const form = this.chequeForms[po.id];
    if (!form.signedDocumentId || !form.chequeDocumentId || !form.chequeNo || !form.chequeBank || !form.chequeAmount) return;
    this.purchasingService
      .issueContract(po.id, form.signedDocumentId, form.chequeNo, form.chequeBank, form.chequeAmount, form.chequeDocumentId)
      .subscribe(() => this.load());
  }

  canCompleteContractIssuance(): boolean {
    return this.purchaseOrders.every((po) => po.hasSignedContract && po.hasCheque || po.poTypeCode === 'Recurring');
  }

  completeContractIssuance(): void {
    this.purchasingService.completeContractIssuance(this.pr.id).subscribe(() => this.refresh.emit());
  }
}
