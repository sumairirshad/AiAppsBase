import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="card">
      <h3>{{ title }}</h3>
      @if (message) {
        <p class="message">{{ message }}</p>
      }
      @if (requireReason) {
        <label class="field">
          <span>{{ reasonLabel }}</span>
          <textarea [(ngModel)]="reason" rows="3" placeholder="Required"></textarea>
        </label>
      }
      <div class="actions">
        <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
        <button type="button" class="btn btn-primary" [disabled]="requireReason && !reason.trim()" (click)="confirm()">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .card {
        background: #fff;
        border-radius: 8px;
        padding: 20px 24px;
        width: 420px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      }
      h3 {
        margin: 0 0 8px;
      }
      .message {
        color: #555;
        margin: 0 0 12px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 12px;
      }
      textarea {
        font: inherit;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        resize: vertical;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  @Input() title = 'Confirm';
  @Input() message = '';
  @Input() requireReason = false;
  @Input() reasonLabel = 'Reason';
  @Input() confirmLabel = 'Confirm';

  reason = '';
  modalClose?: (result?: string | true) => void;

  confirm(): void {
    this.modalClose?.(this.requireReason ? this.reason.trim() : true);
  }

  cancel(): void {
    this.modalClose?.(undefined);
  }
}
