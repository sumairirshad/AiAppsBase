import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { TentativeService } from '../../../core/services/tentative.service';
import { PrDetailDto } from '../../../core/models/requisition.models';
import { PrDetailCoreComponent } from '../../../shared/components/pr-detail-core/pr-detail-core.component';
import { ToastService } from '../../../shared/services/toast.service';
import { ModalService } from '../../../shared/services/modal.service';

@Component({
  selector: 'app-hod-pr-detail',
  standalone: true,
  imports: [PrDetailCoreComponent, RouterLink],
  template: `
    <div class="page">
      <p><a routerLink="/hod/dashboard">&larr; Back to approvals</a></p>
      <app-pr-detail-core [pr]="pr" (act)="onAct($event)">
        @if (pr && pr.statusCode === 'OnHold') {
          <div class="card" style="background:var(--color-surface-muted, #f6f6f6)">
            <h3>Tentative cost variance - needs your approval</h3>
            <p>
              This PR started on a tentative estimate. The final cost came in with a variance of 10-50%
              against the estimate, which requires the department HOD's sign-off (BR-047) before the
              final purchase order is issued.
            </p>
            <button type="button" class="btn btn-primary" [disabled]="submitting" (click)="approveVariance()">
              Approve variance and proceed
            </button>
          </div>
        }
      </app-pr-detail-core>
    </div>
  `,
})
export class HodPrDetailComponent implements OnInit {
  pr: PrDetailDto | null = null;
  submitting = false;
  private prId = 0;

  constructor(
    private route: ActivatedRoute,
    private requisitions: RequisitionsService,
    private tentative: TentativeService,
    private toast: ToastService,
    private modal: ModalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.prId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.requisitions.detail(this.prId).subscribe((pr) => (this.pr = pr));
  }

  onAct(event: { actionCode: string; remarks?: string }): void {
    this.requisitions.act(this.prId, 'HOD', event.actionCode, event.remarks).subscribe(() => {
      this.toast.success('Done.');
      this.load();
    });
  }

  async approveVariance(): Promise<void> {
    const confirmed = await this.modal.confirm({
      title: 'Approve tentative cost variance',
      message: 'This will close the manual PO and issue the final purchase order at the final amount. Continue?',
    });
    if (!confirmed) return;

    this.submitting = true;
    this.tentative.approveVariance(this.prId).subscribe({
      next: () => {
        this.toast.success('Variance approved. Final PO issued.');
        this.router.navigate(['/hod/dashboard']);
      },
      error: () => (this.submitting = false),
    });
  }
}
