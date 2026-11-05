import { Component, Input } from '@angular/core';
import { PrTimelineEntry } from '../../../core/models';

@Component({
  selector: 'app-timeline',
  template: `
    <table mat-table [dataSource]="entries" class="full-width-table" *ngIf="entries.length; else empty">
      <ng-container matColumnDef="actedAt">
        <th mat-header-cell *matHeaderCellDef>Timestamp</th>
        <td mat-cell *matCellDef="let e">{{ e.actedAt | date: 'medium' }}</td>
      </ng-container>
      <ng-container matColumnDef="actorName">
        <th mat-header-cell *matHeaderCellDef>User</th>
        <td mat-cell *matCellDef="let e">{{ e.actorName }}</td>
      </ng-container>
      <ng-container matColumnDef="roleName">
        <th mat-header-cell *matHeaderCellDef>Role</th>
        <td mat-cell *matCellDef="let e">{{ e.roleName }}</td>
      </ng-container>
      <ng-container matColumnDef="action">
        <th mat-header-cell *matHeaderCellDef>Action</th>
        <td mat-cell *matCellDef="let e">{{ e.action }}</td>
      </ng-container>
      <ng-container matColumnDef="detail">
        <th mat-header-cell *matHeaderCellDef>Detail</th>
        <td mat-cell *matCellDef="let e">
          <span *ngIf="e.fromStage">{{ e.fromStage }} &rarr; {{ e.toStage || 'end' }}</span>
          <span *ngIf="e.remarks" class="remarks">{{ e.remarks }}</span>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>
    <ng-template #empty>
      <p class="muted">No activity yet.</p>
    </ng-template>
  `,
  styles: [`
    .full-width-table { width: 100%; }
    .remarks { display: block; color: rgba(0, 0, 0, 0.6); font-size: 0.85em; margin-top: 2px; }
    .muted { color: rgba(0, 0, 0, 0.5); }
  `],
})
export class TimelineComponent {
  @Input() entries: PrTimelineEntry[] = [];
  columns = ['actedAt', 'actorName', 'roleName', 'action', 'detail'];
}
