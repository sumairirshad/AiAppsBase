namespace Procurement.Application.Common;

// The "Permission" layer of the four-layer authorization check: can this role ever perform
// this kind of action at all (regardless of which specific record or task). The "Task" and
// "Data scope" layers that follow it live in IWorkflowEngine and UserAccessService.
public interface IPermissionChecker
{
    Task<bool> HasPermissionAsync(long userId, string permissionCode, CancellationToken ct = default);

    Task RequireAsync(long userId, string permissionCode, CancellationToken ct = default);

    // BR-008: a stage's own dedicated command normally gates on "does this role hold the
    // permission this stage needs" - which is only ever true for the stage's one owning
    // role (e.g. GRN.RECORD for PROCUREMENT). That alone would reject OPD even once a task
    // has genuinely escalated to them, since OPD was never meant to hold GRN.RECORD etc.
    // role-wide. Passing the workflow instance id lets this also accept the actor as the
    // legitimate escalation target for the open task, via IWorkflowEngine.CanActNowAsync -
    // without it, the escalation path in WorkflowStages.EscalateToRoleId is dead on every
    // Operational/Review/Exception/Closure stage, even though WorkflowEngine itself (called
    // later, inside ExecuteAsync) would accept them.
    Task RequireAsync(long userId, string permissionCode, long workflowInstanceId, CancellationToken ct = default);
}
