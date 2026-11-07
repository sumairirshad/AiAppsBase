import { Component, Input, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuditService, AssignedQueryDto } from '../../../core/services/audit.service';
import { ToastService } from '../../services/toast.service';

/**
 * "My queries" - every open query assigned to a role this user holds, to them personally, or
 * (for a Requestor) raised against their own PR, backed by GET /audit/queries/mine. Lets a
 * user discover a query they need to answer instead of relying on the raiser to pass on its id
 * out of band; dropped into every role's dashboard since a query can be addressed to any role.
 */
@Component({
  selector: 'app-my-queries-panel',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <div class="card">
      <h3>My queries</h3>
      @if (queries.length === 0) {
        <div class="empty-state">No open queries assigned to you.</div>
      } @else {
        <table class="data">
          <thead>
            <tr><th>PR #</th><th>Title</th><th>Question</th><th>Raised by</th><th>Raised</th><th></th></tr>
          </thead>
          <tbody>
            @for (q of queries; track q.queryId) {
              <tr>
                <td><a [routerLink]="[detailRoute, q.prId]">{{ q.prNumber }}</a></td>
                <td>{{ q.prTitle }}</td>
                <td>{{ q.queryText }}</td>
                <td>{{ q.raisedByName }}</td>
                <td>{{ q.raisedAt | date: 'medium' }}</td>
                <td>
                  @if (respondingTo === q.queryId) {
                    <div class="field" style="min-width:220px">
                      <textarea rows="2" [(ngModel)]="responseText" placeholder="Your response"></textarea>
                      <div class="actions-row" style="margin-top:4px">
                        <button type="button" class="btn btn-primary btn-sm" [disabled]="!responseText.trim()" (click)="send(q.queryId)">Send</button>
                        <button type="button" class="btn btn-secondary btn-sm" (click)="cancel()">Cancel</button>
                      </div>
                    </div>
                  } @else {
                    <button type="button" class="btn btn-secondary btn-sm" (click)="start(q.queryId)">Respond</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
})
export class MyQueriesPanelComponent implements OnInit {
  /** Where "PR #" links to; each role opens its own PR-detail route. */
  @Input() detailRoute = '/requestor/pr';

  queries: AssignedQueryDto[] = [];
  respondingTo: number | null = null;
  responseText = '';

  constructor(private audit: AuditService, private toast: ToastService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.audit.myQueries().subscribe((q) => (this.queries = q));
  }

  start(queryId: number): void {
    this.respondingTo = queryId;
    this.responseText = '';
  }

  cancel(): void {
    this.respondingTo = null;
    this.responseText = '';
  }

  send(queryId: number): void {
    if (!this.responseText.trim()) return;
    this.audit.respondQuery(queryId, this.responseText.trim()).subscribe({
      next: () => {
        this.toast.success('Response sent. The PR has resumed.');
        this.respondingTo = null;
        this.responseText = '';
        this.load();
      },
    });
  }
}
