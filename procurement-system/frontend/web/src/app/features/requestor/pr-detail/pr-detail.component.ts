import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { PrDetailDto } from '../../../core/models/requisition.models';
import { PrDetailCoreComponent } from '../../../shared/components/pr-detail-core/pr-detail-core.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-requestor-pr-detail',
  standalone: true,
  imports: [PrDetailCoreComponent, RouterLink],
  template: `
    <div class="page">
      <p><a routerLink="/requestor/my-requests">&larr; Back to my requests</a></p>
      <app-pr-detail-core [pr]="pr" (act)="onAct($event)">
        @if (pr && (pr.statusCode === 'Draft' || pr.statusCode === 'Returned')) {
          <button type="button" class="btn btn-primary" (click)="submit()">
            {{ pr.statusCode === 'Returned' ? 'Resubmit' : 'Submit' }}
          </button>
        }
        @if (pr && pr.statusCode === 'AwaitingAcknowledgement') {
          <a [routerLink]="['/requestor/acknowledge', pr.id]" class="btn btn-primary">Acknowledge delivery</a>
        }
        @if (pr && pr.statusCode === 'Queried') {
          <p class="warning-badge">
            A query has been raised against this PR by the reviewing role. Respond via the Audit/Finance query reference
            you were notified with (there is no PR-scoped "list my open queries" endpoint yet to surface the exact query id
            here automatically).
          </p>
        }
      </app-pr-detail-core>
    </div>
  `,
})
export class RequestorPrDetailComponent implements OnInit {
  pr: PrDetailDto | null = null;
  private prId = 0;

  constructor(private route: ActivatedRoute, private requisitions: RequisitionsService, private toast: ToastService) {}

  ngOnInit(): void {
    this.prId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.requisitions.detail(this.prId).subscribe((pr) => (this.pr = pr));
  }

  submit(): void {
    this.requisitions.submit(this.prId).subscribe({
      next: () => {
        this.toast.success('PR submitted.');
        this.load();
      },
    });
  }

  onAct(event: { actionCode: string; remarks?: string }): void {
    this.requisitions.act(this.prId, 'REQUESTOR', event.actionCode, event.remarks).subscribe(() => {
      this.toast.success('Done.');
      this.load();
    });
  }
}
