import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { PrListItemDto } from '../../../core/models/requisition.models';
import { InboxTableComponent } from '../../../shared/components/inbox-table/inbox-table.component';

@Component({
  selector: 'app-requestor-dashboard',
  standalone: true,
  imports: [RouterLink, InboxTableComponent],
  template: `
    <div class="page">
      <div class="card" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h2 style="margin:0">Requestor dashboard</h2>
          <p style="color:var(--color-muted);margin:4px 0 0">Raise purchase requests and track them through to closure.</p>
        </div>
        <a routerLink="/requestor/raise-pr" class="btn btn-primary">+ Raise a PR</a>
      </div>
      <div class="card">
        <h3>My recent requests</h3>
        <app-inbox-table [items]="myPrs" emptyMessage="You haven't raised any PRs yet." detailRoute="/requestor/pr"></app-inbox-table>
      </div>
    </div>
  `,
})
export class RequestorDashboardComponent implements OnInit {
  myPrs: PrListItemDto[] = [];

  constructor(private requisitions: RequisitionsService) {}

  ngOnInit(): void {
    this.requisitions.mine().subscribe((items) => (this.myPrs = items));
  }
}
