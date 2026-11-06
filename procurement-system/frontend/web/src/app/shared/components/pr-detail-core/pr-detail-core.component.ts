import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { PrDetailDto } from '../../../core/models/requisition.models';
import { chipClassForStatus, humanizeStatus } from '../../util/status.util';
import { PrLinesViewComponent } from '../pr-lines-view/pr-lines-view.component';
import { AllowedActionsBarComponent } from '../allowed-actions-bar/allowed-actions-bar.component';

/**
 * The common body of every PR detail screen: header, status, lines, and the allowedActions-
 * driven action bar. Each role's own page component wraps this with whatever extra screen
 * (acknowledge, force-revert, tentative variance...) that role alone can see.
 */
@Component({
  selector: 'app-pr-detail-core',
  standalone: true,
  imports: [DecimalPipe, PrLinesViewComponent, AllowedActionsBarComponent],
  template: `
    @if (pr) {
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <h2 style="margin:0">{{ pr.prNumber }} - {{ pr.title }}</h2>
          <span [class]="chipClassForStatus(pr.statusCode)">{{ humanizeStatus(pr.statusCode) }}</span>
        </div>
        <p style="color:var(--color-muted)">
          Estimated amount: {{ pr.estimatedAmount | number: '1.0-2' }}
          @if (pr.isEmergency) {
            <span class="chip chip-danger">Emergency</span>
          }
        </p>
      </div>

      <div class="card">
        <h3>Lines</h3>
        <app-pr-lines-view [lines]="pr.lines"></app-pr-lines-view>
      </div>

      <div class="card">
        <h3>Actions</h3>
        <app-allowed-actions-bar [actions]="pr.allowedActions" (actionChosen)="act.emit($event)"></app-allowed-actions-bar>
        <ng-content></ng-content>
      </div>
    }
  `,
})
export class PrDetailCoreComponent implements OnChanges {
  @Input() pr: PrDetailDto | null = null;
  @Output() act = new EventEmitter<{ actionCode: string; remarks?: string }>();

  chipClassForStatus = chipClassForStatus;
  humanizeStatus = humanizeStatus;

  ngOnChanges(): void {}
}
