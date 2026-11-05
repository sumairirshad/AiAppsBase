import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <div class="page-header">
      <div>
        <h1>{{ title }}</h1>
        <p *ngIf="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    h1 { margin: 0 0 4px; font-size: 22px; font-weight: 600; color: #1c2b36; }
    .subtitle { margin: 0; color: rgba(0, 0, 0, 0.6); font-size: 14px; }
    .actions { display: flex; gap: 8px; }
  `],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
}
