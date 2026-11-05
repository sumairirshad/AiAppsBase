import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Pr, PrLine } from '../../../../core/models';
import { VendorService } from '../../../../core/services/vendor.service';

interface PoDraft {
  vendorId: number;
  vendorName: string;
  lines: PrLine[];
  deliveryDate: Date;
  paymentTerms: string;
  advanceTypeCode: 'None' | 'Percent' | 'Amount';
  advanceAmount: number | null;
  retentionPct: number | null;
}

@Component({
  selector: 'app-create-po-dialog',
  template: `
    <h2 mat-dialog-title>Create purchase order(s)</h2>
    <mat-dialog-content>
      <mat-card class="po-draft" *ngFor="let draft of drafts">
        <h4>{{ draft.vendorName }}</h4>
        <ul class="line-list">
          <li *ngFor="let line of draft.lines">{{ line.itemName }} &times; {{ line.qty }} {{ line.unitCode }} @ {{ line.estUnitPrice | number: '1.0-2' }}</li>
        </ul>
        <div class="fields">
          <mat-form-field appearance="outline">
            <mat-label>Delivery date</mat-label>
            <input matInput [matDatepicker]="dp" [(ngModel)]="draft.deliveryDate" [ngModelOptions]="{ standalone: true }" />
            <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
            <mat-datepicker #dp></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Payment terms</mat-label>
            <input matInput [(ngModel)]="draft.paymentTerms" [ngModelOptions]="{ standalone: true }" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Advance type</mat-label>
            <mat-select [(ngModel)]="draft.advanceTypeCode" [ngModelOptions]="{ standalone: true }">
              <mat-option value="None">None</mat-option>
              <mat-option value="Amount">Fixed amount</mat-option>
              <mat-option value="Percent">Percentage</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" *ngIf="draft.advanceTypeCode !== 'None'">
            <mat-label>Advance amount</mat-label>
            <input matInput type="number" [(ngModel)]="draft.advanceAmount" [ngModelOptions]="{ standalone: true }" />
          </mat-form-field>
        </div>
      </mat-card>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="undefined">Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()">Create PO(s)</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .po-draft { margin-bottom: 12px; padding: 12px 16px; }
    .line-list { margin: 4px 0 12px; padding-left: 18px; font-size: 13px; color: rgba(0,0,0,0.7); }
    .fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 12px; }
  `],
})
export class CreatePoDialogComponent implements OnInit {
  drafts: PoDraft[] = [];

  constructor(
    private dialogRef: MatDialogRef<CreatePoDialogComponent>,
    private vendorService: VendorService,
    @Inject(MAT_DIALOG_DATA) public pr: Pr,
  ) {}

  ngOnInit(): void {
    const awardedLines = this.pr.lines.filter((l) => l.awardedVendorId != null);
    const byVendor = new Map<number, PrLine[]>();
    for (const line of awardedLines) {
      const list = byVendor.get(line.awardedVendorId!) || [];
      list.push(line);
      byVendor.set(line.awardedVendorId!, list);
    }
    this.drafts = Array.from(byVendor.entries()).map(([vendorId, lines]) => ({
      vendorId,
      vendorName: `Vendor #${vendorId}`,
      lines,
      deliveryDate: new Date(Date.now() + 14 * 86400000),
      paymentTerms: 'Net 30',
      advanceTypeCode: 'None',
      advanceAmount: null,
      retentionPct: null,
    }));

    this.vendorService.list(undefined, false).subscribe((vendors) => {
      const byId = new Map(vendors.map((v) => [v.id, v.legalName]));
      this.drafts.forEach((draft) => {
        const name = byId.get(draft.vendorId);
        if (name) draft.vendorName = name;
      });
    });
  }

  submit(): void {
    this.dialogRef.close(
      this.drafts.map((draft) => ({
        vendorId: draft.vendorId,
        lines: draft.lines.map((l) => ({ prLineId: l.id, qty: l.qty, unitPrice: l.estUnitPrice })),
        deliveryDate: draft.deliveryDate,
        paymentTerms: draft.paymentTerms,
        advanceTypeCode: draft.advanceTypeCode,
        advancePct: null,
        advanceAmount: draft.advanceAmount,
        retentionPct: draft.retentionPct,
      })),
    );
  }
}
