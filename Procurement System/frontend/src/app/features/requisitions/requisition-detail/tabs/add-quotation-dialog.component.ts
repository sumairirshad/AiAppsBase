import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VendorService } from '../../../../core/services/vendor.service';
import { Pr, PrLine, Vendor } from '../../../../core/models';

export interface AddQuotationDialogData {
  pr: Pr;
  prLineIds: number[];
  categoryId: number | null;
}

@Component({
  selector: 'app-add-quotation-dialog',
  template: `
    <h2 mat-dialog-title>Add quotation</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Vendor</mat-label>
          <mat-select formControlName="vendorId">
            <mat-option *ngFor="let v of vendors" [value]="v.id">{{ v.legalName }} <span *ngIf="v.isStarVendor"> (star)</span></mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Quotation number</mat-label>
          <input matInput formControlName="quotationNo" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Quotation date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="quotationDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <h4>Line prices</h4>
        <div class="line" *ngFor="let line of lines">
          <span class="item-name">{{ line.itemName }} ({{ line.qty }} {{ line.unitCode }})</span>
          <mat-form-field appearance="outline" class="price">
            <mat-label>Unit price</mat-label>
            <input matInput type="number" [(ngModel)]="linePrices[line.id]" [ngModelOptions]="{ standalone: true }" />
          </mat-form-field>
        </div>

        <app-document-upload label="Upload quotation" documentTypeCode="Quotation" (uploaded)="documentId = $event"></app-document-upload>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="undefined">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || !documentId" (click)="submit()">Add quotation</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form { min-width: 420px; }
    .full-width { width: 100%; }
    .line { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
    .item-name { flex: 1; font-size: 13px; }
    .price { width: 140px; }
  `],
})
export class AddQuotationDialogComponent implements OnInit {
  form = this.fb.group({
    vendorId: [null as number | null, Validators.required],
    quotationNo: ['', Validators.required],
    quotationDate: [new Date(), Validators.required],
  });
  vendors: Vendor[] = [];
  lines: PrLine[] = [];
  linePrices: Record<number, number> = {};
  documentId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private vendorService: VendorService,
    private dialogRef: MatDialogRef<AddQuotationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddQuotationDialogData,
  ) {}

  ngOnInit(): void {
    this.lines = this.data.pr.lines.filter((l) => this.data.prLineIds.includes(l.id));
    this.vendorService.list(this.data.categoryId ?? undefined).subscribe((vendors) => (this.vendors = vendors));
  }

  submit(): void {
    if (this.form.invalid || !this.documentId) return;
    const v = this.form.getRawValue();
    this.dialogRef.close({
      vendorId: v.vendorId,
      quotationNo: v.quotationNo,
      quotationDate: v.quotationDate,
      documentId: this.documentId,
      lines: this.lines.map((l) => ({ prLineId: l.id, qty: l.qty, unitPrice: this.linePrices[l.id] || 0, tax: 0, discount: 0, deliveryDays: null })),
    });
  }
}
