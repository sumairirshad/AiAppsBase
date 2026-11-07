import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { FinancePortalService } from '../../../core/services/finance-portal.service';
import { InboxTableComponent } from '../../../shared/components/inbox-table/inbox-table.component';
import { MyQueriesPanelComponent } from '../../../shared/components/my-queries-panel/my-queries-panel.component';
import { ToastService } from '../../../shared/services/toast.service';
import { PrListItemDto } from '../../../core/models/requisition.models';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [FormsModule, InboxTableComponent, MyQueriesPanelComponent],
  template: `
    <div class="page">
      <h2>Finance approvals</h2>

      <div class="card">
        <h3>Jump to a PR</h3>
        <div class="actions-row">
          <input type="number" min="1" [(ngModel)]="jumpId" style="max-width:160px" placeholder="PR id" />
          <button type="button" class="btn btn-secondary" [disabled]="!jumpId" (click)="jump()">Open</button>
        </div>
      </div>

      <div class="card">
        <h3>Pending your approval</h3>
        <app-inbox-table [items]="inbox" emptyMessage="No PRs waiting on you." detailRoute="/finance/pr"></app-inbox-table>
      </div>

      <app-my-queries-panel detailRoute="/finance/pr"></app-my-queries-panel>

      <div class="card">
        <h3>Simulate a payment (dev)</h3>
        <p style="color:var(--color-muted)">
          Stands in for the real Finance Portal's callback. Enter the bill/invoice id Procurement gave you when they
          uploaded it.
        </p>
        <div class="actions-row">
          <input type="number" min="1" [(ngModel)]="invoiceId" style="max-width:160px" placeholder="Invoice id" />
          <input type="number" min="0" [(ngModel)]="partialAmount" style="max-width:160px" placeholder="Partial amount (optional)" />
          <button type="button" class="btn btn-primary" [disabled]="!invoiceId" (click)="simulate()">Simulate payment</button>
        </div>
      </div>
    </div>
  `,
})
export class FinanceDashboardComponent implements OnInit {
  inbox: PrListItemDto[] = [];
  jumpId: number | null = null;
  invoiceId: number | null = null;
  partialAmount: number | null = null;

  constructor(private requisitions: RequisitionsService, private financePortal: FinancePortalService, private toast: ToastService, private router: Router) {}

  ngOnInit(): void {
    this.requisitions.inbox('FINANCE').subscribe((items) => (this.inbox = items));
  }

  jump(): void {
    if (this.jumpId) this.router.navigate(['/finance/pr', this.jumpId]);
  }

  simulate(): void {
    if (!this.invoiceId) return;
    this.financePortal.simulatePayment(this.invoiceId, this.partialAmount ?? undefined).subscribe({
      next: () => this.toast.success('Payment simulated.'),
    });
  }
}
