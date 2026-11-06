import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { VendorsService } from '../../../core/services/vendors.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DepartmentDto, LocationDto, UnitDto, ItemDto } from '../../../core/models/catalog.models';
import { VendorDto } from '../../../core/models/vendor.models';
import { CreatePrRequest } from '../../../core/models/requisition.models';
import { PrLinesGridComponent, EditableLine } from '../../../shared/components/pr-lines-grid/pr-lines-grid.component';
import { DocumentUploadComponent } from '../../../shared/components/document-upload/document-upload.component';

const BILL_SUB_HEADS = new Set(['PRE-CYC-USAGE', 'PRE-POL']);
const SPEND_SUB_HEADS = [
  { code: 'APR-FAULT', label: 'Fault (repair/breakdown)' },
  { code: 'APR-PROJECT', label: 'Project' },
  { code: 'PRE-CYC-USAGE', label: 'Cyclic On-Usage bill (electricity, gas, ISP...)' },
  { code: 'PRE-POL', label: 'As Policy (medical claim, allowance...)' },
];

@Component({
  selector: 'app-raise-pr',
  standalone: true,
  imports: [FormsModule, PrLinesGridComponent, DocumentUploadComponent],
  template: `
    <div class="page">
      <h2>Raise a purchase request</h2>
      <div class="card">
        <div class="form-grid">
          <div class="field">
            <label>Department</label>
            <select [(ngModel)]="departmentId" (ngModelChange)="loadItems()">
              @for (d of departments; track d.id) {
                <option [ngValue]="d.id">{{ d.name }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Location</label>
            <select [(ngModel)]="locationId">
              @for (l of locations; track l.id) {
                <option [ngValue]="l.id">{{ l.name }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Spend type</label>
            <select [(ngModel)]="spendSubHeadCode">
              @for (s of spendSubHeads; track s.code) {
                <option [value]="s.code">{{ s.label }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Title</label>
            <input type="text" [(ngModel)]="title" placeholder="Short description" />
          </div>
        </div>

        @if (!isBillRoute) {
          <label class="field" style="flex-direction:row;align-items:center;gap:8px">
            <input type="checkbox" [(ngModel)]="isEmergency" style="width:auto" />
            <span>Emergency (Fault only - waives the star-vendor/3-quote rule, approvals still apply)</span>
          </label>
          @if (isEmergency) {
            <div class="field">
              <label>Emergency justification (mandatory)</label>
              <textarea rows="2" [(ngModel)]="emergencyJustification"></textarea>
            </div>
          }
        }
      </div>

      @if (isBillRoute) {
        <div class="card">
          <h3>Bill details</h3>
          <div class="form-grid">
            <div class="field">
              <label>Billing period (e.g. 2026-01)</label>
              <input type="text" [(ngModel)]="bill.billingPeriod" />
            </div>
            <div class="field">
              <label>Bill amount</label>
              <input type="number" min="0" [(ngModel)]="bill.billAmount" />
            </div>
            <div class="field">
              <label>Purpose</label>
              <input type="text" [(ngModel)]="bill.purpose" />
            </div>
            <div class="field">
              <label>Due date</label>
              <input type="date" [(ngModel)]="bill.dueDate" />
            </div>
            <div class="field">
              <label>Payee vendor</label>
              <select [(ngModel)]="bill.payeeVendorId">
                @for (v of vendors; track v.id) {
                  <option [ngValue]="v.id">{{ v.legalName }}</option>
                }
              </select>
            </div>
          </div>
          <app-document-upload label="Bill document" documentTypeCode="Bill" (uploaded)="bill.billDocumentId = $event"></app-document-upload>
        </div>
      } @else {
        <div class="card">
          <h3>Items</h3>
          <app-pr-lines-grid [lines]="lines" [items]="items" [units]="units"></app-pr-lines-grid>
        </div>
      }

      <div class="actions-row">
        <button type="button" class="btn btn-primary" [disabled]="submitting" (click)="createAndSubmit()">Create and submit</button>
      </div>
    </div>
  `,
})
export class RaisePrComponent implements OnInit {
  departments: DepartmentDto[] = [];
  locations: LocationDto[] = [];
  units: UnitDto[] = [];
  items: ItemDto[] = [];
  vendors: VendorDto[] = [];
  spendSubHeads = SPEND_SUB_HEADS;

  departmentId = 0;
  locationId = 0;
  spendSubHeadCode = SPEND_SUB_HEADS[0].code;
  title = '';
  isEmergency = false;
  emergencyJustification = '';
  lines: EditableLine[] = [];
  bill = { billingPeriod: '', billAmount: 0, purpose: '', dueDate: '', payeeVendorId: 0, billDocumentId: 0 };
  submitting = false;

  get isBillRoute(): boolean {
    return BILL_SUB_HEADS.has(this.spendSubHeadCode);
  }

  constructor(
    private catalog: CatalogService,
    private requisitions: RequisitionsService,
    private vendorsService: VendorsService,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.catalog.departments().subscribe((d) => {
      this.departments = d;
      if (d.length) {
        this.departmentId = d[0].id;
        this.loadItems();
      }
    });
    this.catalog.locations().subscribe((l) => {
      this.locations = l;
      if (l.length) this.locationId = l[0].id;
    });
    this.catalog.units().subscribe((u) => (this.units = u));
    this.vendorsService.list().subscribe((v) => (this.vendors = v.filter((x) => x.statusCode === 'Approved')));
    this.lines.push({ itemId: 0, qty: 1, unitId: 0, estUnitPrice: 0, description: '', suggestedVendorId: null });
  }

  loadItems(): void {
    this.catalog.items(this.departmentId).subscribe((i) => (this.items = i));
  }

  createAndSubmit(): void {
    if (!this.title.trim()) {
      this.toast.error('A title is required.');
      return;
    }
    if (this.isEmergency && !this.emergencyJustification.trim()) {
      this.toast.error('An emergency PR needs a justification.');
      return;
    }

    const body: CreatePrRequest = {
      departmentId: this.departmentId,
      locationId: this.locationId,
      spendSubHeadCode: this.spendSubHeadCode,
      costTypeCode: 'Final',
      isEmergency: this.isEmergency,
      emergencyJustification: this.isEmergency ? this.emergencyJustification : null,
      title: this.title,
      lines: this.isBillRoute ? [] : this.lines.filter((l) => l.itemId > 0),
      bill: this.isBillRoute ? { ...this.bill } : null,
    };

    if (!this.isBillRoute && body.lines.length === 0) {
      this.toast.error('Add at least one item line.');
      return;
    }

    this.submitting = true;
    this.requisitions.create(body).subscribe({
      next: (id) => {
        this.requisitions.submit(id).subscribe({
          next: () => {
            this.submitting = false;
            this.toast.success('PR created and submitted.');
            this.router.navigate(['/requestor/pr', id]);
          },
          error: () => {
            this.submitting = false;
            this.router.navigate(['/requestor/pr', id]);
          },
        });
      },
      error: () => {
        this.submitting = false;
      },
    });
  }
}
