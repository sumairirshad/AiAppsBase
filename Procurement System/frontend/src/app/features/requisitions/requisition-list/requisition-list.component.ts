import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RequisitionService } from '../../../core/services/requisition.service';
import { PrListItem } from '../../../core/models';

@Component({
  selector: 'app-requisition-list',
  template: `
    <app-page-header [title]="title" [subtitle]="subtitle">
      <a mat-raised-button color="primary" routerLink="/requisitions/new"><mat-icon>add</mat-icon> New requisition</a>
    </app-page-header>

    <mat-card>
      <table mat-table [dataSource]="items" class="full-width-table" *ngIf="items.length; else empty">
        <ng-container matColumnDef="prNumber">
          <th mat-header-cell *matHeaderCellDef>PR Ref</th>
          <td mat-cell *matCellDef="let pr"><a [routerLink]="['/requisitions', pr.id]">{{ pr.prNumber }}</a></td>
        </ng-container>
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let pr">{{ pr.title }}</td>
        </ng-container>
        <ng-container matColumnDef="department">
          <th mat-header-cell *matHeaderCellDef>Department</th>
          <td mat-cell *matCellDef="let pr">{{ pr.departmentName }}</td>
        </ng-container>
        <ng-container matColumnDef="spendHead">
          <th mat-header-cell *matHeaderCellDef>Spend Class</th>
          <td mat-cell *matCellDef="let pr">{{ pr.spendSubHeadName }}</td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef>Amount (PKR)</th>
          <td mat-cell *matCellDef="let pr">{{ pr.estimatedAmount | number: '1.0-2' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let pr"><app-status-chip [status]="pr.prStatusCode" [label]="pr.prStatusName"></app-status-chip></td>
        </ng-container>
        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let pr"><a mat-button color="primary" [routerLink]="['/requisitions', pr.id]">Open</a></td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
      <ng-template #empty>
        <p class="empty-state">Nothing here yet.</p>
      </ng-template>
    </mat-card>
  `,
  styles: [`
    .full-width-table { width: 100%; }
    .empty-state { padding: 32px; text-align: center; color: rgba(0,0,0,0.5); }
  `],
})
export class RequisitionListComponent implements OnInit {
  mode: 'mine' | 'inbox' = 'mine';
  items: PrListItem[] = [];
  columns = ['prNumber', 'title', 'department', 'spendHead', 'amount', 'status', 'action'];

  constructor(private requisitionService: RequisitionService, private route: ActivatedRoute) {}

  get title(): string {
    return this.mode === 'mine' ? 'My Requisitions' : 'Approvals Inbox';
  }

  get subtitle(): string {
    return this.mode === 'mine' ? 'Purchase requisitions you have raised' : 'Requisitions waiting on your action';
  }

  ngOnInit(): void {
    this.mode = (this.route.snapshot.data['mode'] as 'mine' | 'inbox') ?? 'mine';
    const source = this.mode === 'mine' ? this.requisitionService.mine() : this.requisitionService.inbox();
    source.subscribe((items) => (this.items = items));
  }
}
