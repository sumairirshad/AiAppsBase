import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

export interface FinanceApproveResult {
  budgetRef: string;
  availableAmount: number;
  remarks: string | null;
}

@Component({
  selector: 'app-finance-approve-dialog',
  template: `
    <h2 mat-dialog-title>Finance approval &amp; budget check</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Budget reference</mat-label>
          <input matInput formControlName="budgetRef" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Available amount (PKR)</mat-label>
          <input matInput type="number" formControlName="availableAmount" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Remarks (optional)</mat-label>
          <textarea matInput formControlName="remarks" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="undefined">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="submit()">Approve</button>
    </mat-dialog-actions>
  `,
  styles: [`.form { min-width: 360px; } .full-width { width: 100%; }`],
})
export class FinanceApproveDialogComponent {
  form = this.fb.group({
    budgetRef: ['', Validators.required],
    availableAmount: [0, [Validators.required, Validators.min(0)]],
    remarks: [''],
  });

  constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<FinanceApproveDialogComponent, FinanceApproveResult>) {}

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.dialogRef.close({ budgetRef: v.budgetRef!, availableAmount: v.availableAmount!, remarks: v.remarks || null });
  }
}
