import { Component } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <div class="toast-stack">
      @for (toast of toast.toasts(); track toast.id) {
        <div class="toast" [class.toast-error]="toast.kind === 'error'" [class.toast-success]="toast.kind === 'success'">
          {{ toast.text }}
          <button type="button" class="dismiss" (click)="toast.dismiss(toast.id)">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-stack {
        position: fixed;
        top: 16px;
        right: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 2000;
        max-width: 360px;
      }
      .toast {
        background: #1f2937;
        color: #fff;
        padding: 10px 36px 10px 14px;
        border-radius: 6px;
        font-size: 14px;
        position: relative;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      .toast-error {
        background: #b23b3b;
      }
      .toast-success {
        background: #1b7a63;
      }
      .dismiss {
        position: absolute;
        right: 8px;
        top: 6px;
        background: none;
        border: none;
        color: inherit;
        font-size: 16px;
        cursor: pointer;
      }
    `,
  ],
})
export class ToastHostComponent {
  constructor(public toast: ToastService) {}
}
