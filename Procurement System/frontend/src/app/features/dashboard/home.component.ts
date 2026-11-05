import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { RequisitionService } from '../../core/services/requisition.service';
import { PrListItem } from '../../core/models';

@Component({
  selector: 'app-home',
  template: `
    <app-page-header [title]="'Welcome, ' + (auth.currentUser?.displayName || '')" [subtitle]="roleSummary"></app-page-header>

    <div class="grid">
      <mat-card>
        <mat-card-header><mat-card-title>My open requisitions</mat-card-title></mat-card-header>
        <mat-card-content>
          <p class="stat">{{ myOpenCount }}</p>
        </mat-card-content>
        <mat-card-actions><a mat-button routerLink="/requisitions/mine">View all</a></mat-card-actions>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Awaiting my action</mat-card-title></mat-card-header>
        <mat-card-content>
          <p class="stat">{{ inboxCount }}</p>
        </mat-card-content>
        <mat-card-actions><a mat-button routerLink="/requisitions/inbox">Open inbox</a></mat-card-actions>
      </mat-card>

      <mat-card>
        <mat-card-header><mat-card-title>Raise a requisition</mat-card-title></mat-card-header>
        <mat-card-content>
          <p class="muted">Start a new Fault, Project, bill or recurring request.</p>
        </mat-card-content>
        <mat-card-actions><a mat-raised-button color="primary" routerLink="/requisitions/new">New requisition</a></mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
    .stat { font-size: 32px; font-weight: 700; margin: 0; color: #1f5f8b; }
    .muted { color: rgba(0,0,0,0.6); }
  `],
})
export class HomeComponent implements OnInit {
  myOpenCount = 0;
  inboxCount = 0;

  constructor(public auth: AuthService, private requisitionService: RequisitionService) {}

  get roleSummary(): string {
    return this.auth.currentUser?.roles.map((r) => r.roleName).join(' · ') || '';
  }

  ngOnInit(): void {
    this.requisitionService.mine().subscribe((items: PrListItem[]) => {
      this.myOpenCount = items.filter((i) => !['Closed', 'Rejected', 'Cancelled'].includes(i.prStatusCode)).length;
    });
    this.requisitionService.inbox().subscribe((items: PrListItem[]) => (this.inboxCount = items.length));
  }
}
