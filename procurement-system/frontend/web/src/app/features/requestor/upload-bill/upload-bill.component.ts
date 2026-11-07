import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { RecurringService } from '../../../core/services/recurring.service';
import { VendorsService } from '../../../core/services/vendors.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PrBillInput, PrDetailDto } from '../../../core/models/requisition.models';
import { VendorDto } from '../../../core/models/vendor.models';
import { DocumentUploadComponent } from '../../../shared/components/document-upload/document-upload.component';

/**
 * The Cyclic Fixed "bill" recurring plan's OWNER_UPLOAD stage (PR status AwaitingBill): once the
 * Worker's RecurringOccurrenceGenerator raises this period's PR, the plan owner (this role) tells
 * the system the actual billing period/amount/document/payee before it can move on, via
 * POST recurring/pr/{id}/upload-bill. Reached from the PR-detail screen, which shows this button
 * only while the PR is at this stage.
 */
@Component({
  selector: 'app-upload-bill',
  standalone: true,
  imports: [FormsModule, RouterLink, DocumentUploadComponent],
  template: `
    <div class="page">
      <p><a [routerLink]="backLink">&larr; {{ backLabel }}</a></p>
      <h2>Upload this period's bill</h2>

      @if (isOpdHandoff) {
        <div class="card" style="background:var(--color-surface-muted, #f6f6f6)">
          <p style="margin:0">
            <strong>Escalated to OPD.</strong> The plan owner did not upload this period's bill within the
            deadline, so OPD is doing it here on their behalf.
          </p>
        </div>
      }

      @if (pr) {
        <div class="card">
          <p><strong>{{ pr.prNumber }}</strong> - {{ pr.title }}</p>
          <p style="color:var(--color-muted)">
            This recurring plan's bill stage is waiting on you. Enter this period's actual billing
            details and upload the bill document so the PR can move on to approval.
          </p>

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
                <option [ngValue]="0">-</option>
                @for (v of vendors; track v.id) {
                  <option [ngValue]="v.id">{{ v.legalName }}</option>
                }
              </select>
            </div>
          </div>

          <app-document-upload label="Bill document" documentTypeCode="Bill" (uploaded)="bill.billDocumentId = $event"></app-document-upload>

          <div class="actions-row">
            <button type="button" class="btn btn-primary" [disabled]="submitting" (click)="submit()">Submit bill</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class UploadBillComponent implements OnInit {
  prId = 0;
  pr: PrDetailDto | null = null;
  vendors: VendorDto[] = [];
  bill: PrBillInput = { billingPeriod: '', billAmount: 0, purpose: '', dueDate: '', billDocumentId: 0, payeeVendorId: 0 };
  submitting = false;

  /** Reused from an OPD-prefixed route when OWNER_UPLOAD has escalated - see app.routes.ts and
   * features/opd/pr-detail. */
  backLink: any[] = ['/requestor/my-requests'];
  backLabel = 'Back to my requests';
  isOpdHandoff = false;
  private doneLink: any[] = ['/requestor/pr'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private requisitions: RequisitionsService,
    private recurring: RecurringService,
    private vendorsService: VendorsService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.prId = Number(this.route.snapshot.paramMap.get('id'));
    const data = this.route.snapshot.data as { roleCode?: string; backLink?: string; backLabel?: string };
    if (data.roleCode === 'OPD') {
      this.isOpdHandoff = true;
      this.backLink = [data.backLink ?? '/opd/pr', this.prId];
      this.backLabel = data.backLabel ?? 'Back to escalated PR';
      this.doneLink = ['/opd/pr'];
    }
    this.requisitions.detail(this.prId).subscribe((pr) => {
      this.pr = pr;
      if (this.isOpdHandoff && pr.allowedActions.length === 0) {
        this.toast.error('This PR is not currently escalated to OPD at this stage.');
        this.router.navigate(['/opd/pr', this.prId]);
      }
    });
    this.vendorsService.list().subscribe((v) => (this.vendors = v.filter((x) => x.statusCode === 'Approved')));
  }

  private canSubmit(): boolean {
    return !!(
      this.bill.billingPeriod.trim() &&
      this.bill.billAmount > 0 &&
      this.bill.purpose.trim() &&
      this.bill.dueDate &&
      this.bill.billDocumentId &&
      this.bill.payeeVendorId
    );
  }

  submit(): void {
    if (!this.canSubmit()) {
      this.toast.error('Fill in the billing period, amount, purpose and due date, upload the bill document, and pick a payee vendor.');
      return;
    }
    this.submitting = true;
    this.recurring.uploadBill(this.prId, this.bill).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success('Bill submitted.');
        this.router.navigate([...this.doneLink, this.prId]);
      },
      error: () => {
        this.submitting = false;
      },
    });
  }
}
