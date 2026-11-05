import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PoLine, PurchaseOrder } from '../../../../core/models';

interface GrnLineDraft {
  poLineId: number;
  itemName: string;
  outstanding: number;
  deliveredQty: number;
  acceptedQty: number;
  rejectedQty: number;
  rejectReason: string;
}

@Component({
  selector: 'app-record-grn-dialog',
  template: `
    <h2 mat-dialog-title>Record goods receipt &mdash; {{ po.poNumber }}</h2>
    <mat-dialog-content>
      <div class="fields">
        <mat-form-field appearance="outline">
          <mat-label>Received on</mat-label>
          <input matInput [matDatepicker]="dp" [(ngModel)]="receivedOn" />
          <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
          <mat-datepicker #dp></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Delivery note no.</mat-label>
          <input matInput [(ngModel)]="deliveryNoteNo" />
        </mat-form-field>
      </div>
      <app-document-upload label="Delivery note" documentTypeCode="DeliveryNote" (uploaded)="deliveryNoteDocumentId = $event"></app-document-upload>

      <div class="line" *ngFor="let line of lines">
        <span class="item-name">{{ line.itemName }} (outstanding {{ line.outstanding }})</span>
        <mat-form-field appearance="outline" class="qty"><mat-label>Delivered</mat-label><input matInput type="number" [(ngModel)]="line.deliveredQty" /></mat-form-field>
        <mat-form-field appearance="outline" class="qty"><mat-label>Accepted</mat-label><input matInput type="number" [(ngModel)]="line.acceptedQty" /></mat-form-field>
        <mat-form-field appearance="outline" class="qty"><mat-label>Rejected</mat-label><input matInput type="number" [(ngModel)]="line.rejectedQty" /></mat-form-field>
        <mat-form-field appearance="outline" class="reason" *ngIf="line.rejectedQty > 0"><mat-label>Reject reason</mat-label><input matInput [(ngModel)]="line.rejectReason" /></mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="undefined">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!deliveryNoteNo" (click)="submit()">Record GRN</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .fields { display: flex; gap: 12px; margin-bottom: 12px; }
    .line { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    .item-name { flex: 2; font-size: 13px; }
    .qty { width: 110px; }
    .reason { flex: 1; }
  `],
})
export class RecordGrnDialogComponent {
  receivedOn = new Date();
  deliveryNoteNo = '';
  deliveryNoteDocumentId: number | null = null;
  lines: GrnLineDraft[];

  constructor(private dialogRef: MatDialogRef<RecordGrnDialogComponent>, @Inject(MAT_DIALOG_DATA) public po: PurchaseOrder) {
    this.lines = po.lines
      .filter((l) => l.outstandingQty > 0)
      .map((l: PoLine) => ({
        poLineId: l.id,
        itemName: l.itemName,
        outstanding: l.outstandingQty,
        deliveredQty: l.outstandingQty,
        acceptedQty: l.outstandingQty,
        rejectedQty: 0,
        rejectReason: '',
      }));
  }

  submit(): void {
    this.dialogRef.close({
      receivedOn: this.receivedOn,
      deliveryNoteNo: this.deliveryNoteNo,
      deliveryNoteDocumentId: this.deliveryNoteDocumentId,
      lines: this.lines.map((l) => ({
        poLineId: l.poLineId,
        deliveredQty: l.deliveredQty,
        acceptedQty: l.acceptedQty,
        rejectedQty: l.rejectedQty,
        rejectReason: l.rejectedQty > 0 ? l.rejectReason : null,
        evidenceDocumentId: null,
      })),
    });
  }
}
