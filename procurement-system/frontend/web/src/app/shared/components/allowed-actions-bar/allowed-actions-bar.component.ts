import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalService } from '../../services/modal.service';

const REMARKS_MANDATORY = new Set(['Reject', 'Return', 'Refer', 'Override', 'ForceRevert', 'Void']);

const LABELS: Record<string, string> = {
  Approve: 'Approve',
  Return: 'Return',
  Reject: 'Reject',
  Query: 'Raise query',
  Refer: 'Approve and refer to OPD',
  Complete: 'Complete',
};

const BUTTON_CLASS: Record<string, string> = {
  Approve: 'btn btn-primary',
  Complete: 'btn btn-primary',
  Return: 'btn btn-secondary',
  Query: 'btn btn-secondary',
  Refer: 'btn btn-secondary',
  Reject: 'btn btn-danger',
};

/**
 * Renders exactly the buttons the API said are allowed (PrDetailDto.allowedActions) - never
 * a hard-coded per-screen list, per the architecture spec ("the UI only draws the buttons the
 * API returns"). Reject/Return/Refer prompt for a mandatory reason via the shared modal
 * before emitting.
 */
@Component({
  selector: 'app-allowed-actions-bar',
  standalone: true,
  template: `
    <div class="actions-row">
      @for (action of actions; track action) {
        <button type="button" [class]="buttonClass(action)" (click)="trigger(action)">{{ label(action) }}</button>
      }
    </div>
  `,
})
export class AllowedActionsBarComponent {
  @Input() actions: string[] = [];
  @Output() actionChosen = new EventEmitter<{ actionCode: string; remarks?: string }>();

  constructor(private modal: ModalService) {}

  label(action: string): string {
    return LABELS[action] ?? action;
  }

  buttonClass(action: string): string {
    return BUTTON_CLASS[action] ?? 'btn btn-secondary';
  }

  async trigger(action: string): Promise<void> {
    if (!REMARKS_MANDATORY.has(action)) {
      this.actionChosen.emit({ actionCode: action });
      return;
    }
    const result = await this.modal.confirm({
      title: this.label(action),
      requireReason: true,
      reasonLabel: action === 'Refer' ? 'Remark for OPD (mandatory)' : 'Reason (mandatory)',
      confirmLabel: this.label(action),
    });
    if (typeof result === 'string' && result.trim()) {
      this.actionChosen.emit({ actionCode: action, remarks: result.trim() });
    }
  }
}
