import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AdminService } from '../../core/services/admin.service';
import { Category } from '../../core/models';

@Component({
  selector: 'app-register-vendor-dialog',
  template: `
    <h2 mat-dialog-title>Register a vendor</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Legal Business Name</mat-label>
          <input matInput formControlName="legalName" />
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline"><mat-label>NTN</mat-label><input matInput formControlName="ntn" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>STRN (optional)</mat-label><input matInput formControlName="strn" /></mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Physical Address</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline"><mat-label>Contact name</mat-label><input matInput formControlName="contactName" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Phone</mat-label><input matInput formControlName="contactPhone" /></mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Contact email</mat-label>
          <input matInput formControlName="contactEmail" />
        </mat-form-field>
        <div class="row">
          <mat-form-field appearance="outline"><mat-label>Bank name</mat-label><input matInput formControlName="bankName" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Account title (for matching)</mat-label><input matInput formControlName="accountTitle" /></mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Account number</mat-label>
          <input matInput formControlName="accountNo" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Approved categories</mat-label>
          <mat-select formControlName="categoryIds" multiple>
            <mat-option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="undefined">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="submit()">Submit for review</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form { min-width: 420px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 12px; }
    .row mat-form-field { flex: 1; }
  `],
})
export class RegisterVendorDialogComponent implements OnInit {
  form = this.fb.group({
    legalName: ['', Validators.required],
    ntn: ['', Validators.required],
    strn: [''],
    address: ['', Validators.required],
    contactName: ['', Validators.required],
    contactPhone: [''],
    contactEmail: [''],
    bankName: ['', Validators.required],
    accountTitle: ['', Validators.required],
    accountNo: ['', Validators.required],
    categoryIds: [[] as number[], Validators.required],
  });
  categories: Category[] = [];

  constructor(private fb: FormBuilder, private adminService: AdminService, private dialogRef: MatDialogRef<RegisterVendorDialogComponent>) {}

  ngOnInit(): void {
    this.adminService.listCategories().subscribe((categories) => (this.categories = categories));
  }

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
