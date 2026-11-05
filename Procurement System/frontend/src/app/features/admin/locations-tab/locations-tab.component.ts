import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Location } from '../../../core/models';

@Component({
  selector: 'app-locations-tab',
  template: `
    <div class="layout">
      <mat-card class="list-card">
        <table mat-table [dataSource]="locations" class="full-width-table">
          <ng-container matColumnDef="code"><th mat-header-cell *matHeaderCellDef>Code</th><td mat-cell *matCellDef="let l">{{ l.code }}</td></ng-container>
          <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let l">{{ l.name }}</td></ng-container>
          <ng-container matColumnDef="address"><th mat-header-cell *matHeaderCellDef>Address</th><td mat-cell *matCellDef="let l">{{ l.address }}</td></ng-container>
          <tr mat-header-row *matHeaderRowDef="['code','name','address']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['code','name','address']"></tr>
        </table>
      </mat-card>
      <mat-card class="form-card">
        <h4>New location</h4>
        <form [formGroup]="form" (ngSubmit)="create()">
          <mat-form-field appearance="outline" class="full-width"><mat-label>Code</mat-label><input matInput formControlName="code" /></mat-form-field>
          <mat-form-field appearance="outline" class="full-width"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline" class="full-width"><mat-label>Address</mat-label><input matInput formControlName="address" /></mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Add</button>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .list-card, .form-card { padding: 16px; }
    .full-width-table, .full-width { width: 100%; }
    h4 { margin: 0 0 12px; }
  `],
})
export class LocationsTabComponent implements OnInit {
  locations: Location[] = [];
  form = this.fb.group({ code: ['', Validators.required], name: ['', Validators.required], address: [''] });

  constructor(private fb: FormBuilder, private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.adminService.listLocations().subscribe((locations) => (this.locations = locations));
  }

  create(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.adminService.createLocation(v.code!, v.name!, v.address || null).subscribe(() => {
      this.form.reset();
      this.load();
    });
  }
}
