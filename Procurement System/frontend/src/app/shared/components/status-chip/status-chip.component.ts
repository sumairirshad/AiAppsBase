import { Component, Input } from '@angular/core';

const POSITIVE = ['Closed', 'Approved', 'Active', 'Completed', 'Received', 'Accepted'];
const NEGATIVE = ['Rejected', 'Cancelled', 'Blacklisted', 'Disputed', 'ShortClosed'];
const WARNING = ['Queried', 'OnHold', 'PendingOpd', 'Escalated', 'Returned'];

@Component({
  selector: 'app-status-chip',
  template: `<span class="status-chip" [ngClass]="toneClass">{{ label || status }}</span>`,
  styles: [`
    .status-chip {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }
    .tone-positive { background: #e3f3e8; color: #1e7a34; }
    .tone-negative { background: #fbe4e4; color: #b3261e; }
    .tone-warning { background: #fff2dd; color: #9a5b00; }
    .tone-neutral { background: #eceff1; color: #45515b; }
  `],
})
export class StatusChipComponent {
  @Input() status = '';
  @Input() label?: string;

  get toneClass(): string {
    if (POSITIVE.includes(this.status)) return 'tone-positive';
    if (NEGATIVE.includes(this.status)) return 'tone-negative';
    if (WARNING.includes(this.status)) return 'tone-warning';
    return 'tone-neutral';
  }
}
