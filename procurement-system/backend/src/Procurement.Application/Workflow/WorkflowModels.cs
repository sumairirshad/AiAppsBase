namespace Procurement.Application.Workflow;

// Action codes written to WorkflowActions.ActionTypeId - matches the ActionTypes lookup seed.
public static class WorkflowActionCode
{
    public const string Submit = "Submit";
    public const string Approve = "Approve";
    public const string Reject = "Reject";
    public const string Return = "Return";
    public const string Resubmit = "Submit"; // a resubmission is just another Submit action
    public const string Query = "Query";
    public const string Respond = "Respond";
    public const string Refer = "Refer";
    public const string Complete = "Complete";
    public const string Skip = "Skip";
    public const string Hold = "Hold";
    public const string Release = "Release";
    public const string Override = "Override";
    public const string ForceRevert = "ForceRevert";
    public const string Void = "Void";
    public const string Cancel = "Cancel";
    public const string Close = "Close";

    public static readonly string[] RemarksMandatory = { Reject, Return, Override, ForceRevert, Void };
}

public static class WorkflowScopeType
{
    public const string None = "None";
    public const string Department = "Department";
    public const string Requester = "Requester";
    public const string FixedDepartment = "FixedDepartment";
}

public record StartWorkflowRequest(
    string DefinitionCode,
    long EntityId,
    long ActorUserId,
    long ActorRoleId,
    long PolicyVersionId,
    decimal Amount,
    long? SpendSubHeadId,
    long OwningDepartmentId,
    long RequesterUserId);

public record WorkflowStartResult(long InstanceId, long? FirstTaskId, string? CurrentStageCode, string? NextRole);

public record ExecuteWorkflowActionRequest(
    long InstanceId,
    long ActorUserId,
    long ActorRoleId,
    string ActionCode,
    long RequesterUserId,
    long OwningDepartmentId,
    string? Remarks = null,
    decimal? CurrentAmount = null,
    bool? IsHigherQuote = null,
    bool? OpdByPolicyOrReferral = null);

public record WorkflowActionResult(
    bool Completed,
    bool Rejected,
    string? CurrentStageCode,
    long? NextTaskId,
    string? NextRole,
    IReadOnlyList<string> AllowedActionsForActor);

public record ApprovalBandStep(int Sequence, long RoleId, string RoleCode);
