namespace Procurement.Application.Workflow;

// The one entry point every module goes through to move a record. Start() is called once,
// at submit; Execute() is called for every later action (approve/reject/return/query/...).
// Both write the WorkflowAction + updated WorkflowTask/WorkflowInstance state in a single
// SaveChanges - callers add their own entity's status change to the same DbContext instance
// before calling this, so one transaction covers the business record, the task, the action
// history and (via the notification/outbox rows this also writes) the alert - exactly the
// "state + audit + outbox in one transaction" rule from the architecture spec.
public interface IWorkflowEngine
{
    Task<WorkflowStartResult> StartAsync(StartWorkflowRequest request, CancellationToken ct = default);

    Task<WorkflowActionResult> ExecuteAsync(ExecuteWorkflowActionRequest request, CancellationToken ct = default);

    Task<IReadOnlyList<string>> GetAllowedActionsAsync(long instanceId, long actorUserId, IReadOnlyCollection<long> actorRoleIds, CancellationToken ct = default);

    // BR-008: true once the open task on this instance is actionable by this actor, either
    // because it's genuinely assigned to their role/user or because they are the stage's
    // escalation target and the task has actually escalated. A dedicated command (GRN,
    // PO/contract, bill forward, audit stamp, acknowledge, ...) whose own permission check
    // is normally gated to one role should also accept this as an alternate authorization,
    // so the stage's escalation path (see WorkflowStages.EscalateToRoleId) actually works.
    Task<bool> CanActNowAsync(long instanceId, long actorUserId, IReadOnlyCollection<long> actorRoleIds, CancellationToken ct = default);

    // Re-opens a task at the stage a PR was last Returned or Queried from (the requester
    // edited the PR and is resubmitting, or answered the query) - never skips back further
    // than that one stage, so whoever was reviewing it still reviews it again.
    Task<WorkflowStartResult> ResumeAsync(long instanceId, long actorUserId, CancellationToken ct = default);
}
