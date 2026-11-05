import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ReasonDialogData {
  title: string;
  label: string;
  required: boolean;
  confirmText?: string;
}

@Component({
  selector: 'app-reason-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ data.label }}</mat-label>
        <textarea matInput rows="4" [formControl]="reason" cdkFocusInitial></textarea>
        <mat-error *ngIf="reason.invalid">This field is required.</mat-error>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="undefined">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="reason.invalid" (click)="submit()">
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; min-width: 360px; }`],
})
export class ReasonDialogComponent {
  reason: FormControl<string | null>;

  constructor(
    public dialogRef: MatDialogRef<ReasonDialogComponent, string>,
    @Inject(MAT_DIALOG_DATA) public data: ReasonDialogData,
  ) {
    this.reason = new FormControl('', data.required ? [Validators.required] : []);
  }

  submit(): void {
    if (this.reason.invalid) return;
    this.dialogRef.close(this.reason.value ?? '');
  }
}
