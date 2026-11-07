import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { AuditService, AssignedQueryDto } from '../../../core/services/audit.service';
import { PrDetailDto } from '../../../core/models/requisition.models';
import { PrDetailCoreComponent } from '../../../shared/components/pr-detail-core/pr-detail-core.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-requestor-pr-detail',
  standalone: true,
  imports: [PrDetailCoreComponent, RouterLink, FormsModule],
  template: `
    <div class="page">
      <p><a routerLink="/requestor/my-requests">&larr; Back to my requests</a></p>
      <app-pr-detail-core [pr]="pr" (act)="onAct($event)" (queried)="load()">
        @if (pr && (pr.statusCode === 'Draft' || pr.statusCode === 'Returned')) {
          <button type="button" class="btn btn-primary" (click)="submit()">
            {{ pr.statusCode === 'Returned' ? 'Resubmit' : 'Submit' }}
          </button>
        }
        @if (pr && pr.statusCode === 'AwaitingAcknowledgement') {
          <a [routerLink]="['/requestor/acknowledge', pr.id]" class="btn btn-primary">Acknowledge delivery</a>
        }
        @if (pr && pr.statusCode === 'AwaitingBill') {
          <a [routerLink]="['/requestor/upload-bill', pr.id]" class="btn btn-primary">Upload this period's bill</a>
        }
        @if (pr && pr.statusCode === 'Queried') {
          <div class="field" style="margin-top:12px">
            @if (myQuery) {
              <p class="warning-badge">A query has been raised against this PR: "{{ myQuery.queryText }}" (from {{ myQuery.raisedByName }}).</p>
              <label style="margin-top:8px">Your response</label>
              <textarea rows="2" [(ngModel)]="responseText"></textarea>
              <button type="button" class="btn btn-primary" style="margin-top:8px;width:fit-content" [disabled]="!responseText.trim()" (click)="respondToQuery()">
                Send response
              </button>
            } @else {
              <p class="warning-badge">
                A query has been raised against this PR, but it isn't addressed to you - check with whoever assigned
                it, or wait for it to resolve.
              </p>
            }
          </div>
        }
      </app-pr-detail-core>
    </div>
  `,
})
export class RequestorPrDetailComponent implements OnInit {
  pr: PrDetailDto | null = null;
  myQuery: AssignedQueryDto | null = null;
  responseText = '';
  private prId = 0;

  constructor(private route: ActivatedRoute, private requisitions: RequisitionsService, private audit: AuditService, private toast: ToastService) {}

  ngOnInit(): void {
    this.prId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.requisitions.detail(this.prId).subscribe((pr) => {
      this.pr = pr;
      this.myQuery = null;
      if (pr.statusCode === 'Queried') {
        // GET /audit/queries/mine finds the open query addressed to this user on this PR,
        // rather than requiring the raiser to pass its id on separately.
        this.audit.myQueries().subscribe((queries) => (this.myQuery = queries.find((q) => q.prId === this.prId) ?? null));
      }
    });
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
    if (event.actionCode === 'Complete') {
      // ACKNOWLEDGE is completed through the dedicated "Acknowledge delivery" flow
      // (POST /receiving/pr/{id}/acknowledge), and OWNER_UPLOAD (cyclic-bill, AwaitingBill)
      // through the dedicated "Upload this period's bill" flow (POST /recurring/pr/{id}/upload-bill)
      // - both shown above, never through the generic act endpoint, which now rejects Complete
      // outright.
      let guidance = 'This stage has no generic "Complete" action - it needs its own dedicated screen.';
      if (this.pr?.statusCode === 'AwaitingAcknowledgement') {
        guidance = 'Use "Acknowledge delivery" above to complete this stage.';
      } else if (this.pr?.statusCode === 'AwaitingBill') {
        guidance = "Use \"Upload this period's bill\" above to complete this stage.";
      }
      this.toast.error(guidance);
      return;
    }
    this.requisitions.act(this.prId, 'REQUESTOR', event.actionCode, event.remarks).subscribe(() => {
      this.toast.success('Done.');
      this.load();
    });
  }

  respondToQuery(): void {
    if (!this.myQuery || !this.responseText.trim()) return;
    this.audit.respondQuery(this.myQuery.queryId, this.responseText.trim()).subscribe({
      next: () => {
        this.toast.success('Response sent. The PR has resumed.');
        this.myQuery = null;
        this.responseText = '';
        this.load();
      },
    });
  }
}
