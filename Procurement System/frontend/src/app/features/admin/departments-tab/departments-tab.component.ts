import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Category, Department } from '../../../core/models';

@Component({
  selector: 'app-departments-tab',
  template: `
    <div class="layout">
      <mat-card class="list-card">
        <table mat-table [dataSource]="departments" class="full-width-table">
          <ng-container matColumnDef="code"><th mat-header-cell *matHeaderCellDef>Code</th><td mat-cell *matCellDef="let d">{{ d.code }}</td></ng-container>
          <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let d">{{ d.name }}</td></ng-container>
          <ng-container matColumnDef="hod"><th mat-header-cell *matHeaderCellDef>HOD</th><td mat-cell *matCellDef="let d">{{ d.hodUserName || '—' }}</td></ng-container>
          <ng-container matColumnDef="select"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let d"><button mat-button color="primary" (click)="selectDepartment(d)">Categories</button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="['code','name','hod','select']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['code','name','hod','select']"></tr>
        </table>
      </mat-card>

      <mat-card class="form-card">
        <h4>New department</h4>
        <form [formGroup]="form" (ngSubmit)="create()">
          <mat-form-field appearance="outline" class="full-width"><mat-label>Code</mat-label><input matInput formControlName="code" /></mat-form-field>
          <mat-form-field appearance="outline" class="full-width"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Add</button>
        </form>

        <ng-container *ngIf="selected">
          <h4>Categories for {{ selected.name }}</h4>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Allowed categories</mat-label>
            <mat-select [(ngModel)]="selectedCategoryIds" multiple>
              <mat-option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="saveCategories()">Save categories</button>
        </ng-container>
      </mat-card>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .list-card, .form-card { padding: 16px; }
    .full-width-table { width: 100%; }
    .full-width { width: 100%; }
    h4 { margin: 0 0 12px; }
  `],
})
export class DepartmentsTabComponent implements OnInit {
  departments: Department[] = [];
  categories: Category[] = [];
  selected: Department | null = null;
  selectedCategoryIds: number[] = [];
  form = this.fb.group({ code: ['', Validators.required], name: ['', Validators.required] });

  constructor(private fb: FormBuilder, private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
    this.adminService.listCategories().subscribe((categories) => (this.categories = categories));
  }

  load(): void {
    this.adminService.listDepartments().subscribe((departments) => (this.departments = departments));
  }

  create(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.adminService.createDepartment(v.code!, v.name!, null).subscribe(() => {
      this.form.reset();
      this.load();
    });
  }

  selectDepartment(department: Department): void {
    this.selected = department;
    this.adminService.listDepartmentCategories(department.id).subscribe((cats) => (this.selectedCategoryIds = cats.map((c) => c.categoryId)));
  }

  saveCategories(): void {
    if (!this.selected) return;
    this.adminService.setDepartmentCategories(this.selected.id, this.selectedCategoryIds).subscribe();
  }
}
