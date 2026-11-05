using Procurement.Domain.Entities;

namespace Procurement.Application.Workflow;

public record WorkflowAdvanceResult(WorkflowStages? NewStage, bool IsCompleted);

/// <summary>
/// Drives WorkflowDefinitions/Stages against WorkflowInstances/Tasks/Actions. It only answers
/// "whose turn is it now" and keeps the decision history; it never touches business-entity columns
/// (e.g. PurchaseRequisitions.PrStatusId) - the calling module reads WorkflowStages.PrStatusId (or maps
/// the new stage itself) and updates its own entity after a successful Start/Advance call.
/// </summary>
public interface IWorkflowEngine
{
    Task<WorkflowInstances> StartAsync(
        string definitionCode, short entityTypeId, long entityId, long policyVersionId,
        IDictionary<string, object> context, long actorUserId, long actorRoleId, CancellationToken ct);

    Task<WorkflowAdvanceResult> AdvanceAsync(
        long instanceId, string actionTypeCode, long actorUserId, long actorRoleId,
        string? remarks, IDictionary<string, object> context, CancellationToken ct);

    Task<WorkflowTasks?> GetOpenTaskAsync(long instanceId, CancellationToken ct);
}
