import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VendorService } from '../../../../core/services/vendor.service';
import { Pr, PurchaseOrder, Vendor } from '../../../../core/models';

@Component({
  selector: 'app-upload-bill-dialog',
  template: `
    <h2 mat-dialog-title>Upload vendor bill</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width" *ngIf="purchaseOrders.length">
          <mat-label>Purchase order</mat-label>
          <mat-select formControlName="poId" (selectionChange)="onPoChange($event.value)">
            <mat-option [value]="null">(none &mdash; bill-route PR)</mat-option>
            <mat-option *ngFor="let po of purchaseOrders" [value]="po.id">{{ po.poNumber }} &mdash; {{ po.vendorName }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Vendor</mat-label>
          <mat-select formControlName="vendorId">
            <mat-option *ngFor="let v of vendors" [value]="v.id">{{ v.legalName }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Vendor invoice reference</mat-label>
          <input matInput formControlName="vendorInvoiceRef" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Invoice date</mat-label>
          <input matInput [matDatepicker]="dp" formControlName="invoiceDate" />
          <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
          <mat-datepicker #dp></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Total (PKR)</mat-label>
          <input matInput type="number" formControlName="total" />
        </mat-form-field>
        <app-document-upload label="Upload invoice" documentTypeCode="Invoice" (uploaded)="documentId = $event"></app-document-upload>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="undefined">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || !documentId" (click)="submit()">Upload</button>
    </mat-dialog-actions>
  `,
  styles: [`.form { min-width: 380px; } .full-width { width: 100%; }`],
})
export class UploadBillDialogComponent implements OnInit {
  form = this.fb.group({
    poId: [null as number | null],
    vendorId: [null as number | null, Validators.required],
    vendorInvoiceRef: ['', Validators.required],
    invoiceDate: [new Date(), Validators.required],
    total: [0, [Validators.required, Validators.min(0.01)]],
  });
  vendors: Vendor[] = [];
  purchaseOrders: PurchaseOrder[] = [];
  documentId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private vendorService: VendorService,
    private dialogRef: MatDialogRef<UploadBillDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { pr: Pr; purchaseOrders: PurchaseOrder[] },
  ) {}

  ngOnInit(): void {
    this.purchaseOrders = this.data.purchaseOrders;
    this.vendorService.list(undefined, false).subscribe((vendors) => (this.vendors = vendors));
  }

  onPoChange(poId: number | null): void {
    const po = this.purchaseOrders.find((p) => p.id === poId);
    if (po) this.form.patchValue({ vendorId: po.vendorId });
  }

  submit(): void {
    if (this.form.invalid || !this.documentId) return;
    const v = this.form.getRawValue();
    this.dialogRef.close({ poId: v.poId, vendorId: v.vendorId, vendorInvoiceRef: v.vendorInvoiceRef, invoiceDate: v.invoiceDate, total: v.total, documentId: this.documentId });
  }
}
