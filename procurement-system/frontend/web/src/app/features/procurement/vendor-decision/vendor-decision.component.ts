import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { VendorsService } from '../../../core/services/vendors.service';
import { PendingVendorRegistrationDto } from '../../../core/models/vendor.models';
import { ToastService } from '../../../shared/services/toast.service';
import { ModalService } from '../../../shared/services/modal.service';

@Component({
  selector: 'app-procurement-vendor-decision',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="page">
      <p><a routerLink="/procurement/dashboard">&larr; Back</a></p>
      <h2>Vet vendor registration</h2>
      @if (registration) {
        <div class="card">
          <p><strong>Request:</strong> {{ registration.requestNo }}</p>
          <p><strong>Legal name:</strong> {{ registration.legalName }}</p>
          <p><strong>Submitted:</strong> {{ registration.createdAt | date: 'medium' }}</p>
          <p style="color:var(--color-muted)">
            Approving sends it to the Procurement HOD for final sign-off; rejecting requires a reason and ends it here.
          </p>
          <div class="actions-row">
            <button type="button" class="btn btn-primary" [disabled]="submitting" (click)="approve()">Approve &amp; forward to HOD</button>
            <button type="button" class="btn btn-danger" [disabled]="submitting" (click)="reject()">Reject</button>
          </div>
        </div>
      } @else {
        <div class="empty-state">Loading...</div>
      }
    </div>
  `,
})
export class ProcurementVendorDecisionComponent implements OnInit {
  registration: PendingVendorRegistrationDto | null = null;
  submitting = false;
  private id = 0;

  constructor(
    private route: ActivatedRoute,
    private vendors: VendorsService,
    private toast: ToastService,
    private modal: ModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.vendors.pendingRegistrations('PendingProcurement').subscribe((list) => {
      this.registration = list.find((r) => r.id === this.id) ?? null;
    });
  }

  approve(): void {
    this.submitting = true;
    this.vendors.procurementDecision(this.id, true).subscribe({
      next: () => {
        this.toast.success('Forwarded to the Procurement HOD.');
        this.router.navigate(['/procurement/dashboard']);
      },
      error: () => (this.submitting = false),
    });
  }

  async reject(): Promise<void> {
    const reason = await this.modal.confirm({ title: 'Reject vendor registration', requireReason: true, reasonLabel: 'Reason (mandatory)', confirmLabel: 'Reject' });
    if (typeof reason !== 'string' || !reason.trim()) return;

    this.submitting = true;
    this.vendors.procurementDecision(this.id, false, reason.trim()).subscribe({
      next: () => {
        this.toast.success('Registration rejected.');
        this.router.navigate(['/procurement/dashboard']);
      },
      error: () => (this.submitting = false),
    });
  }
}
