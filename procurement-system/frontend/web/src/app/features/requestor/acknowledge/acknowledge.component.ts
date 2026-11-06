import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReceivingService } from '../../../core/services/receiving.service';
import { ToastService } from '../../../shared/services/toast.service';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';

@Component({
  selector: 'app-acknowledge',
  standalone: true,
  imports: [FormsModule, StarRatingComponent],
  template: `
    <div class="page">
      <h2>Acknowledge delivery</h2>
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

  constructor(private route: ActivatedRoute, private receiving: ReceivingService, private toast: ToastService, private router: Router) {}

  ngOnInit(): void {
    this.prId = Number(this.route.snapshot.paramMap.get('id'));
  }

  accept(): void {
    this.submitting = true;
    this.receiving.acknowledge(this.prId, true, this.qualityRating || undefined, this.remarks || undefined).subscribe({
      next: () => {
        this.toast.success('Delivery acknowledged.');
        this.router.navigate(['/requestor/pr', this.prId]);
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
        this.router.navigate(['/requestor/pr', this.prId]);
      },
      error: () => (this.submitting = false),
    });
  }
}
