import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RecurringService } from '../../../core/services/recurring.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { AdminService, UserDto } from '../../../core/services/admin.service';
import { VendorsService } from '../../../core/services/vendors.service';
import { ToastService } from '../../../shared/services/toast.service';
import { DepartmentDto, ItemDto, LocationDto, UnitDto } from '../../../core/models/catalog.models';
import { VendorDto } from '../../../core/models/vendor.models';

interface PlanLineForm {
  itemId: number | null;
  qty: number;
  unitId: number | null;
  agreedPrice: number | null;
}

@Component({
  selector: 'app-opd-recurring',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <p><a routerLink="/opd/dashboard">&larr; Back</a></p>
      <h2>Recurring plans</h2>
      <p style="color:var(--color-muted)">
        Set up a Cyclic Fixed-items or Cyclic On-Usage plan so it auto-generates PRs each period (BR-044/046).
      </p>

      <div class="card">
        <h3>New plan</h3>
        <div class="form-grid">
          <div class="field">
            <label>Plan type</label>
            <select [(ngModel)]="plan.planTypeCode">
              <option value="CyclicFixed">Cyclic Fixed items</option>
              <option value="CyclicOnUsage">Cyclic On-Usage</option>
            </select>
          </div>
          <div class="field"><label>Spend sub-head code</label><input type="text" [(ngModel)]="plan.spendSubHeadCode" placeholder="PRE-CYC-USAGE" /></div>
          <div class="field">
            <label>Department</label>
            <select [(ngModel)]="plan.departmentId">
              @for (d of departments; track d.id) { <option [ngValue]="d.id">{{ d.name }}</option> }
            </select>
          </div>
          <div class="field">
            <label>Location</label>
            <select [(ngModel)]="plan.locationId">
              @for (l of locations; track l.id) { <option [ngValue]="l.id">{{ l.name }}</option> }
            </select>
          </div>
          <div class="field">
            <label>Owner user</label>
            <select [(ngModel)]="plan.ownerUserId">
              @for (u of users; track u.id) { <option [ngValue]="u.id">{{ u.displayName }} ({{ u.employeeNo }})</option> }
            </select>
          </div>
          <div class="field">
            <label>Frequency</label>
            <select [(ngModel)]="plan.frequencyCode">
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
            </select>
          </div>
          <div class="field"><label>Generation day of month</label><input type="number" min="1" max="28" [(ngModel)]="plan.generationDay" /></div>
          <div class="field"><label>Start date</label><input type="date" [(ngModel)]="plan.startDate" /></div>
          <div class="field"><label>End date (optional)</label><input type="date" [(ngModel)]="plan.endDate" /></div>
          @if (plan.planTypeCode === 'CyclicFixed') {
            <div class="field">
              <label>Vendor</label>
              <select [(ngModel)]="plan.vendorId">
                @for (v of vendors; track v.id) { <option [ngValue]="v.id">{{ v.legalName }}</option> }
              </select>
            </div>
          } @else {
            <div class="field"><label>Fixed/expected amount (optional)</label><input type="number" min="0" [(ngModel)]="plan.fixedAmount" /></div>
          }
        </div>

        @if (plan.planTypeCode === 'CyclicFixed') {
          <h4>Lines</h4>
          <table class="data">
            <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Agreed price</th><th></th></tr></thead>
            <tbody>
              @for (line of lines; track $index) {
                <tr>
                  <td>
                    <select [(ngModel)]="line.itemId">
                      @for (i of items; track i.id) { <option [ngValue]="i.id">{{ i.name }}</option> }
                    </select>
                  </td>
                  <td><input type="number" min="0.01" step="0.01" [(ngModel)]="line.qty" style="width:90px" /></td>
                  <td>
                    <select [(ngModel)]="line.unitId">
                      @for (u of units; track u.id) { <option [ngValue]="u.id">{{ u.code }}</option> }
                    </select>
                  </td>
                  <td><input type="number" min="0" [(ngModel)]="line.agreedPrice" style="width:110px" /></td>
                  <td><button type="button" class="btn btn-secondary btn-sm" (click)="removeLine($index)">Remove</button></td>
                </tr>
              }
            </tbody>
          </table>
          <button type="button" class="btn btn-secondary" style="margin-top:8px" (click)="addLine()">+ Add line</button>
        }

        <div class="actions-row" style="margin-top:16px">
          <button type="button" class="btn btn-primary" [disabled]="!canCreatePlan()" (click)="createPlan()">Create plan</button>
        </div>
      </div>

      <div class="card">
        <h3>Approve / generate an occurrence</h3>
        <div class="form-grid">
          <div class="field"><label>Plan id</label><input type="number" min="1" [(ngModel)]="planIdForActions" /></div>
          <div class="field"><label>Period start (for generation)</label><input type="date" [(ngModel)]="periodStart" /></div>
        </div>
        <div class="actions-row">
          <button type="button" class="btn btn-primary" [disabled]="!planIdForActions" (click)="approve()">Approve plan</button>
          <button type="button" class="btn btn-secondary" [disabled]="!planIdForActions || !periodStart" (click)="generate()">Generate occurrence now</button>
        </div>
      </div>

      <p style="color:var(--color-muted)">
        Verifying a Cyclic Fixed plan's single quote (BR-046) is done by Procurement, from the Procurement dashboard,
        once the auto-generated PR reaches them - not here.
      </p>
    </div>
  `,
})
export class OpdRecurringComponent implements OnInit {
  departments: DepartmentDto[] = [];
  locations: LocationDto[] = [];
  items: ItemDto[] = [];
  units: UnitDto[] = [];
  vendors: VendorDto[] = [];
  users: UserDto[] = [];

  plan = {
    planTypeCode: 'CyclicFixed',
    spendSubHeadCode: 'PRE-CYC-USAGE',
    departmentId: null as number | null,
    locationId: null as number | null,
    ownerUserId: null as number | null,
    frequencyCode: 'Monthly',
    generationDay: 1,
    startDate: '',
    endDate: '',
    vendorId: null as number | null,
    fixedAmount: null as number | null,
  };
  lines: PlanLineForm[] = [{ itemId: null, qty: 1, unitId: null, agreedPrice: null }];

  planIdForActions: number | null = null;
  periodStart = '';

  constructor(private recurring: RecurringService, private catalog: CatalogService, private admin: AdminService, private vendorsService: VendorsService, private toast: ToastService) {}

  ngOnInit(): void {
    this.catalog.departments().subscribe((d) => (this.departments = d));
    this.catalog.locations().subscribe((l) => (this.locations = l));
    this.catalog.items().subscribe((i) => (this.items = i));
    this.catalog.units().subscribe((u) => (this.units = u));
    this.vendorsService.list().subscribe((v) => (this.vendors = v.filter((x) => x.statusCode === 'Approved')));
    this.admin.users().subscribe((u) => (this.users = u));
  }

  addLine(): void {
    this.lines.push({ itemId: null, qty: 1, unitId: null, agreedPrice: null });
  }

  removeLine(index: number): void {
    this.lines.splice(index, 1);
  }

  canCreatePlan(): boolean {
    return !!(this.plan.departmentId && this.plan.locationId && this.plan.ownerUserId && this.plan.startDate && this.plan.spendSubHeadCode.trim());
  }

  createPlan(): void {
    if (!this.canCreatePlan()) return;
    this.recurring
      .createPlan({
        planTypeCode: this.plan.planTypeCode,
        spendSubHeadCode: this.plan.spendSubHeadCode.trim(),
        departmentId: this.plan.departmentId!,
        locationId: this.plan.locationId!,
        ownerUserId: this.plan.ownerUserId!,
        frequencyCode: this.plan.frequencyCode,
        generationDay: this.plan.generationDay,
        startDate: this.plan.startDate,
        endDate: this.plan.endDate || null,
        vendorId: this.plan.planTypeCode === 'CyclicFixed' ? this.plan.vendorId : null,
        fixedAmount: this.plan.planTypeCode === 'CyclicOnUsage' ? this.plan.fixedAmount : null,
        lines: this.plan.planTypeCode === 'CyclicFixed' ? (this.lines.filter((l) => l.itemId && l.unitId) as { itemId: number; qty: number; unitId: number; agreedPrice?: number | null }[]) : [],
      })
      .subscribe((id) => {
        this.toast.success(`Plan #${id} created. It needs approval before it can generate PRs.`);
      });
  }

  approve(): void {
    if (!this.planIdForActions) return;
    this.recurring.approvePlan(this.planIdForActions).subscribe(() => this.toast.success('Plan approved.'));
  }

  generate(): void {
    if (!this.planIdForActions || !this.periodStart) return;
    this.recurring.generateNow(this.planIdForActions, this.periodStart).subscribe((prId) => {
      this.toast.success(prId ? `Occurrence generated as PR #${prId}.` : 'Nothing was generated for this period (already generated, or plan inactive).');
    });
  }
}
