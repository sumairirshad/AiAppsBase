import { Component, OnInit } from '@angular/core';
import { RequisitionsService } from '../../../core/services/requisitions.service';
import { PrListItemDto } from '../../../core/models/requisition.models';
import { InboxTableComponent } from '../../../shared/components/inbox-table/inbox-table.component';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [InboxTableComponent],
  template: `
    <div class="page">
      <h2>My requests</h2>
      <div class="card">
        <app-inbox-table [items]="items" emptyMessage="You haven't raised any PRs yet." detailRoute="/requestor/pr"></app-inbox-table>
      </div>
    </div>
  `,
})
export class MyRequestsComponent implements OnInit {
  items: PrListItemDto[] = [];

  constructor(private requisitions: RequisitionsService) {}

  ngOnInit(): void {
    this.requisitions.mine().subscribe((items) => (this.items = items));
  }
}
