import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { RecurringService } from '../../../core/services/recurring.service';
import { Department, Location, SpendSubHead, UserSummary } from '../../../core/models';
import { RecurringPlan } from '../../../core/models';

@Component({
  selector: 'app-recurring-tab',
  template: `
    <div class="layout">
      <mat-card class="list-card">
        <table mat-table [dataSource]="plans" class="full-width-table">
          <ng-container matColumnDef="planNo"><th mat-header-cell *matHeaderCellDef>Plan</th><td mat-cell *matCellDef="let p">{{ p.planNo }}</td></ng-container>
          <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let p">{{ p.recurringPlanTypeCode }}</td></ng-container>
          <ng-container matColumnDef="department"><th mat-header-cell *matHeaderCellDef>Department</th><td mat-cell *matCellDef="let p">{{ p.departmentName }}</td></ng-container>
          <ng-container matColumnDef="owner"><th mat-header-cell *matHeaderCellDef>Owner</th><td mat-cell *matCellDef="let p">{{ p.ownerName }}</td></ng-container>
          <ng-container matColumnDef="frequency"><th mat-header-cell *matHeaderCellDef>Frequency</th><td mat-cell *matCellDef="let p">{{ p.frequencyCode }}</td></ng-container>
          <ng-container matColumnDef="action"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let p"><button mat-button color="primary" (click)="generate(p)">Generate occurrence</button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="['planNo','type','department','owner','frequency','action']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['planNo','type','department','owner','frequency','action']"></tr>
        </table>
      </mat-card>

      <mat-card class="form-card">
        <h4>New recurring plan</h4>
        <form [formGroup]="form" (ngSubmit)="create()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Type</mat-label>
            <mat-select formControlName="recurringPlanTypeCode"><mat-option value="Bill">Bill</mat-option><mat-option value="Items">Items</mat-option></mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Spend class</mat-label>
            <mat-select formControlName="spendSubHeadId"><mat-option *ngFor="let s of spendSubHeads" [value]="s.id">{{ s.name }}</mat-option></mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Department</mat-label>
            <mat-select formControlName="departmentId"><mat-option *ngFor="let d of departments" [value]="d.id">{{ d.name }}</mat-option></mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Location</mat-label>
            <mat-select formControlName="locationId"><mat-option *ngFor="let l of locations" [value]="l.id">{{ l.name }}</mat-option></mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Owner</mat-label>
            <mat-select formControlName="ownerUserId"><mat-option *ngFor="let u of users" [value]="u.id">{{ u.displayName }}</mat-option></mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Frequency</mat-label>
            <mat-select formControlName="frequencyCode">
              <mat-option value="Monthly">Monthly</mat-option>
              <mat-option value="Quarterly">Quarterly</mat-option>
              <mat-option value="HalfYearly">Half-yearly</mat-option>
              <mat-option value="Yearly">Yearly</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Generation day of period</mat-label>
            <input matInput type="number" formControlName="generationDay" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Due offset (days)</mat-label>
            <input matInput type="number" formControlName="dueOffsetDays" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Start date</mat-label>
            <input matInput [matDatepicker]="dp" formControlName="startDate" />
            <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
            <mat-datepicker #dp></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width" *ngIf="form.value.recurringPlanTypeCode === 'Bill'">
            <mat-label>Fixed amount (PKR)</mat-label>
            <input matInput type="number" formControlName="fixedAmount" />
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Create plan</button>
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
export class RecurringTabComponent implements OnInit {
  plans: RecurringPlan[] = [];
  departments: Department[] = [];
  locations: Location[] = [];
  spendSubHeads: SpendSubHead[] = [];
  users: UserSummary[] = [];

  form = this.fb.group({
    recurringPlanTypeCode: ['Bill' as 'Bill' | 'Items', Validators.required],
    spendSubHeadId: [null, Validators.required],
    departmentId: [null, Validators.required],
    locationId: [null, Validators.required],
    ownerUserId: [null, Validators.required],
    frequencyCode: ['Monthly', Validators.required],
    generationDay: [1, Validators.required],
    dueOffsetDays: [10, Validators.required],
    startDate: [new Date(), Validators.required],
    fixedAmount: [null as number | null],
  });

  constructor(private fb: FormBuilder, private adminService: AdminService, private recurringService: RecurringService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.load();
    this.adminService.listDepartments().subscribe((departments) => (this.departments = departments));
    this.adminService.listLocations().subscribe((locations) => (this.locations = locations));
    this.adminService.listSpendSubHeads().subscribe((s) => (this.spendSubHeads = s));
    this.adminService.listUsers().subscribe((users) => (this.users = users));
  }

  load(): void {
    this.recurringService.list().subscribe((plans) => (this.plans = plans));
  }

  create(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.recurringService
      .create({
        recurringPlanTypeCode: v.recurringPlanTypeCode!,
        spendSubHeadId: v.spendSubHeadId!,
        departmentId: v.departmentId!,
        locationId: v.locationId!,
        ownerUserId: v.ownerUserId!,
        frequencyCode: v.frequencyCode!,
        generationDay: v.generationDay!,
        dueOffsetDays: v.dueOffsetDays!,
        startDate: v.startDate!.toISOString().slice(0, 10),
        endDate: null,
        vendorId: null,
        fixedAmount: v.fixedAmount,
        lines: null,
      })
      .subscribe(() => {
        this.form.reset({ recurringPlanTypeCode: 'Bill', frequencyCode: 'Monthly', generationDay: 1, dueOffsetDays: 10, startDate: new Date() });
        this.load();
      });
  }

  generate(plan: RecurringPlan): void {
    this.recurringService.generateOccurrence(plan.id).subscribe({
      next: (prId) => this.snackBar.open(`Occurrence generated as PR #${prId}.`, 'Dismiss', { duration: 5000 }),
    });
  }
}
