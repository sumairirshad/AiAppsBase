import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../services/modal.service';
import { AuditService } from '../../../core/services/audit.service';
import { ToastService } from '../../services/toast.service';

const REMARKS_MANDATORY = new Set(['Reject', 'Return', 'Refer', 'Override', 'ForceRevert', 'Void']);

const QUERY_TARGET_ROLES = [
  { code: 'REQUESTOR', label: 'Requestor' },
  { code: 'HOD', label: 'HOD' },
  { code: 'FINANCE', label: 'Finance' },
  { code: 'PROCUREMENT', label: 'Procurement' },
  { code: 'AUDIT', label: 'Audit' },
  { code: 'OPD', label: 'OPD' },
];

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
 * that directly (via prId) instead of emitting actionChosen. The target role is picked from
 * the dropdown next to the button (defaulting to Requestor, by far the most common case);
 * whoever that role is assigned to can now find the query themselves via GET
 * /audit/queries/mine ("My queries" on their dashboard) instead of being told its id.
 */
@Component({
  selector: 'app-allowed-actions-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="actions-row">
      @for (action of actions; track action) {
        @if (action === 'Query') {
          <select [(ngModel)]="queryTargetRole" style="max-width:160px" title="Who should answer this query">
            @for (r of queryTargetRoles; track r.code) {
              <option [value]="r.code">{{ r.label }}</option>
            }
          </select>
        }
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

  queryTargetRoles = QUERY_TARGET_ROLES;
  queryTargetRole = 'REQUESTOR';

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
    const roleLabel = this.queryTargetRoles.find((r) => r.code === this.queryTargetRole)?.label ?? this.queryTargetRole;
    const text = await this.modal.confirm({
      title: 'Raise a query',
      message: `This pauses the PR and sends your question to ${roleLabel}; it resumes at this same stage once they respond.`,
      requireReason: true,
      reasonLabel: 'Your question (mandatory)',
      confirmLabel: 'Raise query',
    });
    if (typeof text !== 'string' || !text.trim()) return;

    this.audit.raiseQuery(this.prId, text.trim(), this.queryTargetRole).subscribe({
      next: () => {
        this.toast.success(`Query raised to ${roleLabel}. It will show up in their "My queries" panel.`);
        this.queried.emit();
      },
    });
  }
}
