import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { RequisitionService } from '../../../core/services/requisition.service';
import { AuthService } from '../../../core/services/auth.service';
import { Department, Item, Location, SpendSubHead, Unit } from '../../../core/models';

const BILL_MODE_CODES = ['Bill', 'PolicyClaim', 'RecurringBill'];

@Component({
  selector: 'app-requisition-create',
  templateUrl: './requisition-create.component.html',
  styleUrls: ['./requisition-create.component.scss'],
})
export class RequisitionCreateComponent implements OnInit {
  form: FormGroup;
  departments: Department[] = [];
  locations: Location[] = [];
  items: Item[] = [];
  units: Unit[] = [];
  spendSubHeads: SpendSubHead[] = [];
  billDocumentId: number | null = null;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private requisitionService: RequisitionService,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      departmentId: [auth.currentUser?.departmentId ?? null, Validators.required],
      locationId: [null, Validators.required],
      spendSubHeadId: [null, Validators.required],
      isTentative: [false],
      isEmergency: [false],
      emergencyJustification: [''],
      title: ['', Validators.required],
      lines: this.fb.array([]),
      billingPeriod: [''],
      billAmount: [null],
      purpose: [''],
      dueDate: [null],
    });
  }

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  get lineGroups(): FormGroup[] {
    return this.lines.controls as FormGroup[];
  }

  get selectedSubHead(): SpendSubHead | undefined {
    return this.spendSubHeads.find((s) => s.id === this.form.value.spendSubHeadId);
  }

  get isBillRoute(): boolean {
    const subHead = this.selectedSubHead;
    return !!subHead && BILL_MODE_CODES.includes(subHead.procurementModeCode);
  }

  ngOnInit(): void {
    forkJoin({
      departments: this.adminService.listDepartments(),
      locations: this.adminService.listLocations(),
      items: this.adminService.listItems(),
      units: this.adminService.listUnits(),
      spendSubHeads: this.adminService.listSpendSubHeads(),
    }).subscribe(({ departments, locations, items, units, spendSubHeads }) => {
      this.departments = departments;
      this.locations = locations;
      this.items = items;
      this.units = units;
      this.spendSubHeads = spendSubHeads;
    });

    this.addLine();
  }

  addLine(): void {
    this.lines.push(
      this.fb.group({
        itemId: [null, Validators.required],
        description: [''],
        qty: [1, [Validators.required, Validators.min(0.001)]],
        unitId: [null, Validators.required],
        estUnitPrice: [0, [Validators.required, Validators.min(0)]],
        locationId: [this.form.value.locationId],
      }),
    );
  }

  removeLine(index: number): void {
    this.lines.removeAt(index);
  }

  onBillDocumentUploaded(documentId: number): void {
    this.billDocumentId = documentId;
  }

  get lineTotal(): number {
    return this.lines.controls.reduce((sum, ctrl) => sum + (ctrl.value.qty || 0) * (ctrl.value.estUnitPrice || 0), 0);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.isBillRoute && !this.billDocumentId) {
      this.snackBar.open('Please upload the bill document.', 'Dismiss', { duration: 5000 });
      return;
    }

    const v = this.form.getRawValue();
    this.submitting = true;
    this.requisitionService
      .create({
        departmentId: v.departmentId,
        locationId: v.locationId,
        spendSubHeadId: v.spendSubHeadId,
        projectId: null,
        isTentative: v.isTentative,
        isEmergency: v.isEmergency,
        emergencyJustification: v.isEmergency ? v.emergencyJustification : null,
        title: v.title,
        lines: this.isBillRoute ? null : v.lines,
        billingPeriod: this.isBillRoute ? v.billingPeriod : null,
        billAmount: this.isBillRoute ? v.billAmount : null,
        purpose: this.isBillRoute ? v.purpose : null,
        dueDate: this.isBillRoute ? v.dueDate : null,
        billDocumentId: this.isBillRoute ? this.billDocumentId : null,
      })
      .subscribe({
        next: (id) => this.router.navigate(['/requisitions', id]),
        error: () => (this.submitting = false),
      });
  }
}
