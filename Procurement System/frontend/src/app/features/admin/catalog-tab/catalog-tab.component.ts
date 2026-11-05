import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Category, Item, Unit } from '../../../core/models';

@Component({
  selector: 'app-catalog-tab',
  template: `
    <div class="layout">
      <mat-card class="form-card">
        <h4>New category</h4>
        <form [formGroup]="categoryForm" (ngSubmit)="createCategory()">
          <mat-form-field appearance="outline" class="full-width"><mat-label>Code</mat-label><input matInput formControlName="code" /></mat-form-field>
          <mat-form-field appearance="outline" class="full-width"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="categoryForm.invalid">Add category</button>
        </form>
        <mat-list>
          <mat-list-item *ngFor="let c of categories">{{ c.name }} ({{ c.code }})</mat-list-item>
        </mat-list>
      </mat-card>

      <mat-card class="form-card">
        <h4>New item</h4>
        <form [formGroup]="itemForm" (ngSubmit)="createItem()">
          <mat-form-field appearance="outline" class="full-width"><mat-label>Code</mat-label><input matInput formControlName="code" /></mat-form-field>
          <mat-form-field appearance="outline" class="full-width"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Category</mat-label>
            <mat-select formControlName="categoryId"><mat-option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</mat-option></mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Unit</mat-label>
            <mat-select formControlName="unitId"><mat-option *ngFor="let u of units" [value]="u.id">{{ u.name }}</mat-option></mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="itemForm.invalid">Add item</button>
        </form>
        <mat-list>
          <mat-list-item *ngFor="let i of items">{{ i.name }} ({{ i.categoryName }})</mat-list-item>
        </mat-list>
      </mat-card>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-card { padding: 16px; }
    .full-width { width: 100%; }
    h4 { margin: 0 0 12px; }
  `],
})
export class CatalogTabComponent implements OnInit {
  categories: Category[] = [];
  items: Item[] = [];
  units: Unit[] = [];
  categoryForm = this.fb.group({ code: ['', Validators.required], name: ['', Validators.required] });
  itemForm = this.fb.group({ code: ['', Validators.required], name: ['', Validators.required], categoryId: [null, Validators.required], unitId: [null, Validators.required] });

  constructor(private fb: FormBuilder, private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.adminService.listCategories().subscribe((categories) => (this.categories = categories));
    this.adminService.listItems().subscribe((items) => (this.items = items));
    this.adminService.listUnits().subscribe((units) => (this.units = units));
  }

  createCategory(): void {
    if (this.categoryForm.invalid) return;
    const v = this.categoryForm.getRawValue();
    this.adminService.createCategory(v.code!, v.name!, null).subscribe(() => {
      this.categoryForm.reset();
      this.load();
    });
  }

  createItem(): void {
    if (this.itemForm.invalid) return;
    const v = this.itemForm.getRawValue();
    this.adminService.createItem(v.code!, v.name!, v.categoryId!, v.unitId!).subscribe(() => {
      this.itemForm.reset();
      this.load();
    });
  }
}
