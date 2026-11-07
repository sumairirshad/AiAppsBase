import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DepartmentDto, LocationDto, CategoryDto, UnitDto, ItemDto, ProjectDto } from '../../../core/models/catalog.models';

@Component({
  selector: 'app-opd-catalog-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <p><a routerLink="/opd/dashboard">&larr; Back</a></p>
      <h2>Catalog &amp; organization administration</h2>

      <div class="card">
        <h3>Departments</h3>
        <table class="data">
          <thead><tr><th>Code</th><th>Name</th></tr></thead>
          <tbody>
            @for (d of departments; track d.id) {
              <tr><td>{{ d.code }}</td><td>{{ d.name }}</td></tr>
            }
          </tbody>
        </table>
        <div class="form-grid" style="margin-top:8px">
          <div class="field"><label>Code</label><input type="text" [(ngModel)]="newDepartment.code" /></div>
          <div class="field"><label>Name</label><input type="text" [(ngModel)]="newDepartment.name" /></div>
        </div>
        <button type="button" class="btn btn-primary" [disabled]="!newDepartment.code.trim() || !newDepartment.name.trim()" (click)="addDepartment()">Add department</button>
      </div>

      <div class="card">
        <h3>Locations</h3>
        <table class="data">
          <thead><tr><th>Code</th><th>Name</th><th>Address</th><th>Active</th></tr></thead>
          <tbody>
            @for (l of locations; track l.id) {
              <tr>
                <td>{{ l.code }}</td>
                <td>{{ l.name }}</td>
                <td>{{ l.address }}</td>
                <td>
                  <input type="checkbox" style="width:auto" [checked]="l.isActive" (change)="toggleLocation(l)" />
                </td>
              </tr>
            }
          </tbody>
        </table>
        <div class="form-grid" style="margin-top:8px">
          <div class="field"><label>Code</label><input type="text" [(ngModel)]="newLocation.code" /></div>
          <div class="field"><label>Name</label><input type="text" [(ngModel)]="newLocation.name" /></div>
          <div class="field"><label>Address</label><input type="text" [(ngModel)]="newLocation.address" /></div>
        </div>
        <button type="button" class="btn btn-primary" [disabled]="!newLocation.code.trim() || !newLocation.name.trim()" (click)="addLocation()">Add location</button>
      </div>

      <div class="card">
        <h3>Categories</h3>
        <table class="data">
          <thead><tr><th>Code</th><th>Name</th></tr></thead>
          <tbody>
            @for (c of categories; track c.id) {
              <tr><td>{{ c.code }}</td><td>{{ c.name }}</td></tr>
            }
          </tbody>
        </table>
        <div class="form-grid" style="margin-top:8px">
          <div class="field"><label>Code</label><input type="text" [(ngModel)]="newCategory.code" /></div>
          <div class="field"><label>Name</label><input type="text" [(ngModel)]="newCategory.name" /></div>
        </div>
        <button type="button" class="btn btn-primary" [disabled]="!newCategory.code.trim() || !newCategory.name.trim()" (click)="addCategory()">Add category</button>

        <h4 style="margin-top:16px">Grant a department access to a category</h4>
        <div class="form-grid">
          <div class="field">
            <label>Department</label>
            <select [(ngModel)]="mapping.departmentId">
              @for (d of departments; track d.id) { <option [ngValue]="d.id">{{ d.name }}</option> }
            </select>
          </div>
          <div class="field">
            <label>Category</label>
            <select [(ngModel)]="mapping.categoryId">
              @for (c of categories; track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select>
          </div>
        </div>
        <button type="button" class="btn btn-secondary" [disabled]="!mapping.departmentId || !mapping.categoryId" (click)="addMapping()">Grant access</button>
      </div>

      <div class="card">
        <h3>Units of measure</h3>
        <table class="data">
          <thead><tr><th>Code</th><th>Name</th></tr></thead>
          <tbody>
            @for (u of units; track u.id) {
              <tr><td>{{ u.code }}</td><td>{{ u.name }}</td></tr>
            }
          </tbody>
        </table>
        <div class="form-grid" style="margin-top:8px">
          <div class="field"><label>Code</label><input type="text" [(ngModel)]="newUnit.code" /></div>
          <div class="field"><label>Name</label><input type="text" [(ngModel)]="newUnit.name" /></div>
          <div class="field"><label>Decimal precision</label><input type="number" min="0" max="4" [(ngModel)]="newUnit.precision" /></div>
        </div>
        <button type="button" class="btn btn-primary" [disabled]="!newUnit.code.trim() || !newUnit.name.trim()" (click)="addUnit()">Add unit</button>
      </div>

      <div class="card">
        <h3>Catalog items</h3>
        <table class="data">
          <thead><tr><th>Code</th><th>Name</th><th>Unit</th></tr></thead>
          <tbody>
            @for (i of items; track i.id) {
              <tr><td>{{ i.code }}</td><td>{{ i.name }}</td><td>{{ i.unitCode }}</td></tr>
            }
          </tbody>
        </table>
        <div class="form-grid" style="margin-top:8px">
          <div class="field"><label>Code</label><input type="text" [(ngModel)]="newItem.code" /></div>
          <div class="field"><label>Name</label><input type="text" [(ngModel)]="newItem.name" /></div>
          <div class="field">
            <label>Category</label>
            <select [(ngModel)]="newItem.categoryId">
              @for (c of categories; track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select>
          </div>
          <div class="field">
            <label>Unit</label>
            <select [(ngModel)]="newItem.unitId">
              @for (u of units; track u.id) { <option [ngValue]="u.id">{{ u.name }}</option> }
            </select>
          </div>
        </div>
        <button type="button" class="btn btn-primary" [disabled]="!newItem.code.trim() || !newItem.name.trim() || !newItem.categoryId || !newItem.unitId" (click)="addItem()">Add item</button>
      </div>

      <div class="card">
        <h3>Projects</h3>
        <table class="data">
          <thead><tr><th>Code</th><th>Name</th></tr></thead>
          <tbody>
            @for (p of projects; track p.id) {
              <tr><td>{{ p.projectCode }}</td><td>{{ p.name }}</td></tr>
            }
          </tbody>
        </table>
        <div class="form-grid" style="margin-top:8px">
          <div class="field"><label>Project code</label><input type="text" [(ngModel)]="newProject.projectCode" /></div>
          <div class="field"><label>Name</label><input type="text" [(ngModel)]="newProject.name" /></div>
          <div class="field">
            <label>Owner department</label>
            <select [(ngModel)]="newProject.ownerDepartmentId">
              @for (d of departments; track d.id) { <option [ngValue]="d.id">{{ d.name }}</option> }
            </select>
          </div>
          <label class="field" style="flex-direction:row;align-items:center;gap:8px">
            <input type="checkbox" style="width:auto" [(ngModel)]="newProject.contractProvided" />
            <span>Contract provided</span>
          </label>
        </div>
        <button type="button" class="btn btn-primary" [disabled]="!newProject.projectCode.trim() || !newProject.name.trim() || !newProject.ownerDepartmentId" (click)="addProject()">
          Add project
        </button>
      </div>

      <div class="card">
        <h3>Market survey entry</h3>
        <p style="color:var(--color-muted)">Feeds the market-price warning shown on PR lines (BR-024).</p>
        <div class="form-grid">
          <div class="field">
            <label>Item</label>
            <select [(ngModel)]="survey.itemId">
              @for (i of items; track i.id) { <option [ngValue]="i.id">{{ i.name }}</option> }
            </select>
          </div>
          <div class="field">
            <label>Location (optional)</label>
            <select [(ngModel)]="survey.locationId">
              <option [ngValue]="null">Any</option>
              @for (l of locations; track l.id) { <option [ngValue]="l.id">{{ l.name }}</option> }
            </select>
          </div>
          <div class="field"><label>Surveyed price</label><input type="number" min="0" [(ngModel)]="survey.surveyedPrice" /></div>
          <div class="field"><label>Source</label><input type="text" [(ngModel)]="survey.source" placeholder="Vendor quote / market check" /></div>
          <div class="field"><label>Surveyed on</label><input type="date" [(ngModel)]="survey.surveyedOn" /></div>
        </div>
        <button type="button" class="btn btn-primary" [disabled]="!survey.itemId || !survey.surveyedPrice || !survey.surveyedOn" (click)="addSurvey()">Record survey</button>
      </div>
    </div>
  `,
})
export class OpdCatalogAdminComponent implements OnInit {
  departments: DepartmentDto[] = [];
  locations: LocationDto[] = [];
  categories: CategoryDto[] = [];
  units: UnitDto[] = [];
  items: ItemDto[] = [];
  projects: ProjectDto[] = [];

  newDepartment = { code: '', name: '' };
  newLocation = { code: '', name: '', address: '' };
  newCategory = { code: '', name: '' };
  mapping = { departmentId: null as number | null, categoryId: null as number | null };
  newUnit = { code: '', name: '', precision: 0 };
  newItem = { code: '', name: '', categoryId: null as number | null, unitId: null as number | null };
  newProject = { projectCode: '', name: '', ownerDepartmentId: null as number | null, contractProvided: false };
  survey = { itemId: null as number | null, locationId: null as number | null, surveyedPrice: 0, source: '', surveyedOn: '' };

  constructor(private catalog: CatalogService, private toast: ToastService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.catalog.departments().subscribe((d) => (this.departments = d));
    this.catalog.locations().subscribe((l) => (this.locations = l));
    this.catalog.categories().subscribe((c) => (this.categories = c));
    this.catalog.units().subscribe((u) => (this.units = u));
    this.catalog.items().subscribe((i) => (this.items = i));
    this.catalog.projects().subscribe((p) => (this.projects = p));
  }

  addDepartment(): void {
    this.catalog.createDepartment(this.newDepartment.code.trim(), this.newDepartment.name.trim()).subscribe(() => {
      this.toast.success('Department added.');
      this.newDepartment = { code: '', name: '' };
      this.load();
    });
  }

  addLocation(): void {
    this.catalog.createLocation(this.newLocation.code.trim(), this.newLocation.name.trim(), this.newLocation.address.trim() || undefined).subscribe(() => {
      this.toast.success('Location added.');
      this.newLocation = { code: '', name: '', address: '' };
      this.load();
    });
  }

  toggleLocation(l: LocationDto): void {
    this.catalog.updateLocation(l.id, l.name, l.address, !l.isActive).subscribe(() => {
      this.toast.success('Location updated.');
      this.load();
    });
  }

  addCategory(): void {
    this.catalog.createCategory(this.newCategory.code.trim(), this.newCategory.name.trim()).subscribe(() => {
      this.toast.success('Category added.');
      this.newCategory = { code: '', name: '' };
      this.load();
    });
  }

  addMapping(): void {
    if (!this.mapping.departmentId || !this.mapping.categoryId) return;
    this.catalog.mapDepartmentCategory(this.mapping.departmentId, this.mapping.categoryId).subscribe(() => {
      this.toast.success('Access granted.');
      this.mapping = { departmentId: null, categoryId: null };
    });
  }

  addUnit(): void {
    this.catalog.createUnit(this.newUnit.code.trim(), this.newUnit.name.trim(), this.newUnit.precision).subscribe(() => {
      this.toast.success('Unit added.');
      this.newUnit = { code: '', name: '', precision: 0 };
      this.load();
    });
  }

  addItem(): void {
    if (!this.newItem.categoryId || !this.newItem.unitId) return;
    this.catalog.createItem(this.newItem.code.trim(), this.newItem.name.trim(), this.newItem.categoryId, this.newItem.unitId).subscribe(() => {
      this.toast.success('Item added.');
      this.newItem = { code: '', name: '', categoryId: null, unitId: null };
      this.load();
    });
  }

  addProject(): void {
    if (!this.newProject.ownerDepartmentId) return;
    this.catalog
      .createProject(this.newProject.projectCode.trim(), this.newProject.name.trim(), this.newProject.ownerDepartmentId, undefined, this.newProject.contractProvided)
      .subscribe(() => {
        this.toast.success('Project added.');
        this.newProject = { projectCode: '', name: '', ownerDepartmentId: null, contractProvided: false };
        this.load();
      });
  }

  addSurvey(): void {
    if (!this.survey.itemId) return;
    this.catalog.createMarketSurvey(this.survey.itemId, this.survey.locationId, this.survey.surveyedPrice, this.survey.source.trim(), this.survey.surveyedOn).subscribe(() => {
      this.toast.success('Market survey recorded.');
      this.survey = { itemId: null, locationId: null, surveyedPrice: 0, source: '', surveyedOn: '' };
    });
  }
}
