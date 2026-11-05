import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-page',
  template: `
    <app-page-header title="Administration" subtitle="Master data, users and recurring plans"></app-page-header>
    <mat-tab-group animationDuration="150ms">
      <mat-tab label="Departments"><app-departments-tab></app-departments-tab></mat-tab>
      <mat-tab label="Locations"><app-locations-tab></app-locations-tab></mat-tab>
      <mat-tab label="Catalog"><app-catalog-tab></app-catalog-tab></mat-tab>
      <mat-tab label="Users &amp; Roles"><app-users-tab></app-users-tab></mat-tab>
      <mat-tab label="Recurring Plans"><app-recurring-tab></app-recurring-tab></mat-tab>
    </mat-tab-group>
  `,
})
export class AdminPageComponent {}
