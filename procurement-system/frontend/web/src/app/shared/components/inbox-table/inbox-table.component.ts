import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { PrListItemDto } from '../../../core/models/requisition.models';
import { chipClassForStatus, daysSince, humanizeStatus } from '../../util/status.util';

@Component({
  selector: 'app-inbox-table',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    @if (items.length === 0) {
      <div class="empty-state">{{ emptyMessage }}</div>
    } @else {
      <table class="data">
        <thead>
          <tr>
            <th>PR #</th>
            <th>Title</th>
            <th>Department</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Days open</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (item of items; track item.id) {
            <tr (click)="open(item.id)" style="cursor:pointer">
              <td>{{ item.prNumber }}</td>
              <td>
                {{ item.title }}
                @if (item.isEmergency) {
                  <span class="chip chip-danger">Emergency</span>
                }
              </td>
              <td>{{ item.departmentCode }}</td>
              <td>{{ item.estimatedAmount | number: '1.0-2' }}</td>
              <td><span [class]="chipClassForStatus(item.statusCode)">{{ humanizeStatus(item.statusCode) }}</span></td>
              <td>{{ daysSince(item.submittedAt) ?? '-' }}</td>
              <td><button type="button" class="btn btn-secondary btn-sm" (click)="open(item.id); $event.stopPropagation()">Open</button></td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class InboxTableComponent {
  @Input() items: PrListItemDto[] = [];
  @Input() emptyMessage = 'Nothing here.';
  @Input() detailRoute = 'detail';

  chipClassForStatus = chipClassForStatus;
  humanizeStatus = humanizeStatus;
  daysSince = daysSince;

  constructor(private router: Router) {}

  open(id: number): void {
    this.router.navigate([this.detailRoute, id]);
  }
}
