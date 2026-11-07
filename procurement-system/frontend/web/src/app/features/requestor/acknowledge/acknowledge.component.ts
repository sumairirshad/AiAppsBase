import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReceivingService } from '../../../core/services/receiving.service';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { ToastService } from '../../../shared/services/toast.service';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-acknowledge',
  standalone: true,
  imports: [FormsModule, RouterLink, StarRatingComponent],
  template: `
    <div class="page">
      <p><a [routerLink]="backLink">&larr; {{ backLabel }}</a></p>
      <h2>Acknowledge delivery</h2>
      @if (isOpdHandoff) {
        <div class="card" style="background:var(--color-surface-muted, #f6f6f6)">
          <p style="margin:0">
            <strong>Escalated to OPD.</strong> The requestor did not acknowledge delivery within the deadline, so
            OPD is doing it here on the requestor's behalf.
          </p>
        </div>
      }
      <div class="card">
        <p>Confirm the goods arrived or the work is done, and rate the vendor's quality. Disputing sends it back to Procurement with your reason.</p>

        <div class="field">
          <span class="label">Quality rating</span>
          <app-star-rating [(value)]="qualityRating"></app-star-rating>
        </div>

        <div class="field">
          <label>Remarks (optional)</label>
          <textarea rows="2" [(ngModel)]="remarks"></textarea>
        </div>

        <div class="actions-row">
          <button type="button" class="btn btn-primary" [disabled]="submitting" (click)="accept()">Acknowledge (accepted)</button>
          <button type="button" class="btn btn-danger" [disabled]="submitting" (click)="dispute()">Dispute</button>
        </div>

        @if (disputing) {
          <div class="field" style="margin-top:12px">
            <label>Dispute reason (mandatory)</label>
            <textarea rows="2" [(ngModel)]="disputeReason"></textarea>
            <button type="button" class="btn btn-danger" style="margin-top:8px;width:fit-content" [disabled]="!disputeReason.trim() || submitting" (click)="confirmDispute()">
              Send dispute
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class AcknowledgeComponent implements OnInit {
  prId = 0;
  qualityRating = 0;
  remarks = '';
  disputing = false;
  disputeReason = '';
  submitting = false;

  /** Reused from an OPD-prefixed route when ACKNOWLEDGE has escalated - see app.routes.ts and
   * features/opd/pr-detail. Route `data` supplies where "back" and "done" should go instead of
   * the Requestor's own screens. */
  backLink: any[] = ['/requestor/my-requests'];
  backLabel = 'Back to my requests';
  isOpdHandoff = false;
  private doneLink: any[] = ['/requestor/pr'];

  constructor(
    private route: ActivatedRoute,
    private receiving: ReceivingService,
    private requisitions: RequisitionsService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.prId = Number(this.route.snapshot.paramMap.get('id'));
    const data = this.route.snapshot.data as { roleCode?: string; backLink?: string; backLabel?: string };
    if (data.roleCode === 'OPD') {
      this.isOpdHandoff = true;
      this.backLink = [data.backLink ?? '/opd/pr', this.prId];
      this.backLabel = data.backLabel ?? 'Back to escalated PR';
      this.doneLink = ['/opd/pr'];
      // Defends against navigating here by hand for a PR that was never actually escalated to
      // OPD at the ACKNOWLEDGE stage.
      this.requisitions.detail(this.prId).subscribe((pr) => {
        if (pr.allowedActions.length === 0) {
          this.toast.error('This PR is not currently escalated to OPD at this stage.');
          this.router.navigate(['/opd/pr', this.prId]);
        }
      });
    }
  }

  accept(): void {
    this.submitting = true;
    this.receiving.acknowledge(this.prId, true, this.qualityRating || undefined, this.remarks || undefined).subscribe({
      next: () => {
        this.toast.success('Delivery acknowledged.');
        this.router.navigate([...this.doneLink, this.prId]);
      },
      error: () => (this.submitting = false),
    });
  }

  dispute(): void {
    this.disputing = true;
  }

  confirmDispute(): void {
    this.submitting = true;
    this.receiving.acknowledge(this.prId, false, this.qualityRating || undefined, this.remarks || undefined, this.disputeReason).subscribe({
      next: () => {
        this.toast.success('Dispute sent to Procurement.');
        this.router.navigate([...this.doneLink, this.prId]);
      },
      error: () => (this.submitting = false),
    });
  }
}
