import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalService } from '../../services/modal.service';
import { AuditService } from '../../../core/services/audit.service';
import { ToastService } from '../../services/toast.service';

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
 *
 * "Query" is special-cased: the generic /requisitions/{id}/act endpoint accepts a Query
 * action code and moves the PR to Queried, but it never creates an AuditQueries row - so
 * nothing could ever be found to respond to and resume the workflow. The only endpoint that
 * actually creates a resolvable query is POST /audit/pr/{id}/queries, so this button calls
 * that directly (via prId) instead of emitting actionChosen, and always targets the
 * Requestor (the overwhelmingly common case, and the only role with a "respond" screen in
 * this build) rather than exposing the backend's generic any-role targeting.
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
  @Input() prId!: number;
  @Output() actionChosen = new EventEmitter<{ actionCode: string; remarks?: string }>();
  @Output() queried = new EventEmitter<void>();

  constructor(private modal: ModalService, private audit: AuditService, private toast: ToastService) {}

  label(action: string): string {
    return LABELS[action] ?? action;
  }

  buttonClass(action: string): string {
    return BUTTON_CLASS[action] ?? 'btn btn-secondary';
  }

  async trigger(action: string): Promise<void> {
    if (action === 'Query') {
      await this.raiseQuery();
      return;
    }
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

  private async raiseQuery(): Promise<void> {
    const text = await this.modal.confirm({
      title: 'Raise a query',
      message: 'This pauses the PR and sends your question to the Requestor; it resumes at this same stage once they respond.',
      requireReason: true,
      reasonLabel: 'Your question (mandatory)',
      confirmLabel: 'Raise query',
    });
    if (typeof text !== 'string' || !text.trim()) return;

    this.audit.raiseQuery(this.prId, text.trim(), 'REQUESTOR').subscribe({
      next: (queryId) => {
        this.toast.success(`Query #${queryId} raised. Share this id with the Requestor so they can respond.`);
        this.queried.emit();
      },
    });
  }
}
