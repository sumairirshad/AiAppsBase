import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { VendorsService } from '../../../core/services/vendors.service';
import { AuthService } from '../../../core/auth/auth.service';
import { InboxTableComponent } from '../../../shared/components/inbox-table/inbox-table.component';
import { PrListItemDto } from '../../../core/models/requisition.models';
import { PendingVendorRegistrationDto } from '../../../core/models/vendor.models';

@Component({
  selector: 'app-hod-dashboard',
  standalone: true,
  imports: [FormsModule, DatePipe, InboxTableComponent],
  template: `
    <div class="page">
      <h2>HOD approvals</h2>

      <div class="card">
        <h3>Jump to a PR</h3>
        <p style="color:var(--color-muted)">
          Have a PR id from a notification (e.g. a tentative-cost variance put on hold, or a queried PR)? Open it directly.
        </p>
        <div class="actions-row">
          <input type="number" min="1" [(ngModel)]="jumpId" style="max-width:160px" placeholder="PR id" />
          <button type="button" class="btn btn-secondary" [disabled]="!jumpId" (click)="jump()">Open</button>
        </div>
      </div>

      <div class="card">
        <h3>Pending your approval</h3>
        <app-inbox-table [items]="inbox" emptyMessage="No PRs waiting on you." detailRoute="/hod/pr"></app-inbox-table>
      </div>

      @if (isProcurementHod) {
        <div class="card">
          <h3>Vendor registrations awaiting your decision</h3>
          @if (vendorRegistrations.length === 0) {
            <div class="empty-state">No vendor registrations waiting on you.</div>
          } @else {
            <table class="data">
              <thead>
                <tr><th>Request #</th><th>Legal name</th><th>Submitted</th><th></th></tr>
              </thead>
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
      }
    </div>
  `,
})
export class HodDashboardComponent implements OnInit {
  inbox: PrListItemDto[] = [];
  vendorRegistrations: PendingVendorRegistrationDto[] = [];
  jumpId: number | null = null;
  isProcurementHod = false;

  constructor(
    private requisitions: RequisitionsService,
    private vendors: VendorsService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isProcurementHod = this.auth.isProcurementHod();
    this.requisitions.inbox('HOD').subscribe((items) => (this.inbox = items));
    if (this.isProcurementHod) {
      this.vendors.pendingRegistrations('PendingProcurementHod').subscribe((v) => (this.vendorRegistrations = v));
    }
  }

  jump(): void {
    if (this.jumpId) this.router.navigate(['/hod/pr', this.jumpId]);
  }

  openVendorDecision(id: number): void {
    this.router.navigate(['/hod/vendor-decisions', id]);
  }
}
