import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { AuditService } from '../../../core/services/audit.service';
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
        @if (pr && pr.statusCode === 'Queried') {
          <div class="field" style="margin-top:12px">
            <p class="warning-badge">
              A query has been raised against this PR. Ask whoever raised it for the query id, enter it below with
              your answer, and the PR resumes right where it was paused.
            </p>
            <label>Query id</label>
            <input type="number" min="1" [(ngModel)]="queryId" style="max-width:160px" />
            <label style="margin-top:8px">Your response</label>
            <textarea rows="2" [(ngModel)]="responseText"></textarea>
            <button type="button" class="btn btn-primary" style="margin-top:8px;width:fit-content" [disabled]="!queryId || !responseText.trim()" (click)="respondToQuery()">
              Send response
            </button>
          </div>
        }
      </app-pr-detail-core>
    </div>
  `,
})
export class RequestorPrDetailComponent implements OnInit {
  pr: PrDetailDto | null = null;
  queryId: number | null = null;
  responseText = '';
  private prId = 0;

  constructor(private route: ActivatedRoute, private requisitions: RequisitionsService, private audit: AuditService, private toast: ToastService) {}

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

  respondToQuery(): void {
    if (!this.queryId || !this.responseText.trim()) return;
    this.audit.respondQuery(this.queryId, this.responseText.trim()).subscribe({
      next: () => {
        this.toast.success('Response sent. The PR has resumed.');
        this.queryId = null;
        this.responseText = '';
        this.load();
      },
    });
  }
}
