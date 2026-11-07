import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { VendorsService } from '../../../core/services/vendors.service';
import { RecurringService } from '../../../core/services/recurring.service';
import { InboxTableComponent } from '../../../shared/components/inbox-table/inbox-table.component';
import { ModalService } from '../../../shared/services/modal.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PrListItemDto } from '../../../core/models/requisition.models';
import { PendingVendorRegistrationDto, VendorDto } from '../../../core/models/vendor.models';

@Component({
  selector: 'app-procurement-dashboard',
  standalone: true,
  imports: [FormsModule, InboxTableComponent, DatePipe],
  template: `
    <div class="page">
      <h2>Procurement</h2>

      <div class="card">
        <h3>Sourcing workbench</h3>
        <p style="color:var(--color-muted)">
          Accept a PR for sourcing, enter quotations, select the winning vendor, create the purchase order, generate
          and activate the contract, and forward the bill - all from one PR's workbench screen.
        </p>
        <div class="actions-row">
          <input type="number" min="1" [(ngModel)]="workbenchPrId" style="max-width:160px" placeholder="PR id" />
          <button type="button" class="btn btn-primary" [disabled]="!workbenchPrId" (click)="openWorkbench()">Open workbench</button>
        </div>
      </div>

      <div class="card">
        <h3>PRs needing your action</h3>
        <app-inbox-table [items]="inbox" emptyMessage="Nothing waiting on the generic queue - most sourcing work starts from a PR id above, once Requisitions shows it as PendingProcurement." detailRoute="/procurement/pr"></app-inbox-table>
      </div>

      <div class="card">
        <h3>Vendor registrations to vet</h3>
        @if (vendorRegistrations.length === 0) {
          <div class="empty-state">None pending.</div>
        } @else {
          <table class="data">
            <thead><tr><th>Request #</th><th>Legal name</th><th>Submitted</th><th></th></tr></thead>
            <tbody>
              @for (v of vendorRegistrations; track v.id) {
                <tr>
                  <td>{{ v.requestNo }}</td>
                  <td>{{ v.legalName }}</td>
                  <td>{{ v.createdAt | date: 'medium' }}</td>
                  <td><button type="button" class="btn btn-secondary btn-sm" (click)="openVendorDecision(v.id)">Review</button></td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <div class="card">
        <h3>Blacklist a vendor</h3>
        <div class="form-grid">
          <div class="field">
            <label>Vendor</label>
            <select [(ngModel)]="blacklistVendorId">
              @for (v of vendors; track v.id) { <option [ngValue]="v.id">{{ v.legalName }} ({{ v.statusCode }})</option> }
            </select>
          </div>
        </div>
        <button type="button" class="btn btn-danger" [disabled]="!blacklistVendorId" (click)="blacklist()">Blacklist</button>
      </div>

      <div class="card">
        <h3>Verify the single quote for a Cyclic Fixed PR</h3>
        <p style="color:var(--color-muted)">BR-046: confirm the agreed-rate PR's actual unit price before it proceeds to approval.</p>
        <div class="form-grid">
          <div class="field"><label>PR id</label><input type="number" min="1" [(ngModel)]="verify.prId" /></div>
          <div class="field"><label>Verified unit price</label><input type="number" min="0" [(ngModel)]="verify.unitPrice" /></div>
        </div>
        <button type="button" class="btn btn-primary" [disabled]="!verify.prId" (click)="verifyQuote()">Verify</button>
      </div>
    </div>
  `,
})
export class ProcurementDashboardComponent implements OnInit {
  inbox: PrListItemDto[] = [];
  vendorRegistrations: PendingVendorRegistrationDto[] = [];
  vendors: VendorDto[] = [];
  workbenchPrId: number | null = null;
  blacklistVendorId: number | null = null;
  verify = { prId: null as number | null, unitPrice: 0 };

  constructor(
    private requisitions: RequisitionsService,
    private vendors_: VendorsService,
    private recurring: RecurringService,
    private modal: ModalService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.requisitions.inbox('PROCUREMENT').subscribe((items) => (this.inbox = items));
    this.vendors_.pendingRegistrations('PendingProcurement').subscribe((v) => (this.vendorRegistrations = v));
    this.vendors_.list().subscribe((v) => (this.vendors = v.filter((x) => x.statusCode !== 'Blacklisted')));
  }

  openWorkbench(): void {
    if (this.workbenchPrId) this.router.navigate(['/procurement/pr', this.workbenchPrId]);
  }

  openVendorDecision(id: number): void {
    this.router.navigate(['/procurement/vendor-decisions', id]);
  }

  async blacklist(): Promise<void> {
    if (!this.blacklistVendorId) return;
    const reason = await this.modal.confirm({ title: 'Blacklist vendor', requireReason: true, reasonLabel: 'Reason (mandatory)', confirmLabel: 'Blacklist' });
    if (typeof reason !== 'string' || !reason.trim()) return;
    this.vendors_.blacklist(this.blacklistVendorId, reason.trim()).subscribe(() => {
      this.toast.success('Vendor blacklisted.');
      this.blacklistVendorId = null;
      this.vendors_.list().subscribe((v) => (this.vendors = v.filter((x) => x.statusCode !== 'Blacklisted')));
    });
  }

  verifyQuote(): void {
    if (!this.verify.prId) return;
    this.recurring.verifyQuote(this.verify.prId, this.verify.unitPrice).subscribe(() => {
      this.toast.success('Quote verified. PR moved to approval.');
      this.verify = { prId: null, unitPrice: 0 };
    });
  }
}
