using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Workflow;

public class WorkflowEngine : IWorkflowEngine
{
    private readonly IApplicationDbContext _db;
    private readonly IApprovalBandResolver _bandResolver;
    private readonly LookupCache _lookups;
    private readonly IDateTimeProvider _clock;

    public WorkflowEngine(IApplicationDbContext db, IApprovalBandResolver bandResolver, LookupCache lookups, IDateTimeProvider clock)
    {
        _db = db;
        _bandResolver = bandResolver;
        _lookups = lookups;
        _clock = clock;
    }

    public async Task<WorkflowStartResult> StartAsync(StartWorkflowRequest request, CancellationToken ct = default)
    {
        var definition = await _db.WorkflowDefinitions.FirstOrDefaultAsync(d => d.Code == request.DefinitionCode, ct)
            ?? throw new InvalidOperationException($"No active WorkflowDefinition '{request.DefinitionCode}'.");

        var stages = await _db.WorkflowStages
            .Where(s => s.DefinitionId == definition.Id)
            .OrderBy(s => s.Sequence)
            .ToListAsync(ct);

        var instance = new WorkflowInstances
        {
            DefinitionId = definition.Id,
            EntityTypeId = definition.EntityTypeId,
            EntityId = request.EntityId,
            Status = "Running",
            PolicyVersionId = request.PolicyVersionId,
            StartedAt = _clock.UtcNow,
            CreatedBy = request.ActorUserId,
        };
        _db.Set<WorkflowInstances>().Add(instance);
        await _db.SaveChangesAsync(ct); // need instance.Id before writing actions/tasks against it

        var submitActionTypeId = await _lookups.IdAsync<ActionTypes, short>(WorkflowActionCode.Submit, ct);
        await WriteActionAsync(instance, null, null, submitActionTypeId, request.ActorUserId, request.ActorRoleId, null, ct);

        var roleSet = await _bandResolver.ResolveAsync(request.PolicyVersionId, request.Amount, request.SpendSubHeadId, ct);
        var roleCodes = roleSet.Select(r => r.RoleCode).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var next = await AdvanceToNextApplicableStageAsync(instance, stages, afterSequence: 0, roleCodes, default, ct);

        return new WorkflowStartResult(instance.Id, next?.TaskId, next?.Stage.StageCode, next?.RoleCode);
    }

    public async Task<WorkflowActionResult> ExecuteAsync(ExecuteWorkflowActionRequest request, CancellationToken ct = default)
    {
        var instance = await _db.WorkflowInstances.FirstOrDefaultAsync(i => i.Id == request.InstanceId, ct)
            ?? throw new InvalidOperationException($"No WorkflowInstance {request.InstanceId}.");
        if (instance.Status != "Running")
            throw new InvalidOperationException($"WorkflowInstance {instance.Id} is already {instance.Status}.");

        var task = await _db.WorkflowTasks
            .Where(t => t.InstanceId == instance.Id)
            .OrderByDescending(t => t.Id)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("No open task on this workflow instance.");

        var taskStatusOpen = await _lookups.IdAsync<TaskStatuses, short>("Open", ct);
        if (task.TaskStatusId != taskStatusOpen)
            throw new InvalidOperationException("This task has already been actioned.");

        var stage = await _db.WorkflowStages.FirstAsync(s => s.Id == task.StageId, ct);

        await AuthorizeAsync(task, stage, request, ct);

        if (WorkflowActionCode.RemarksMandatory.Contains(request.ActionCode) && string.IsNullOrWhiteSpace(request.Remarks))
            throw new InvalidOperationException($"'{request.ActionCode}' requires remarks.");

        var actionTypeId = await _lookups.IdAsync<ActionTypes, short>(request.ActionCode, ct);
        var completedStatus = await _lookups.IdAsync<TaskStatuses, short>("Completed", ct);
        task.TaskStatusId = completedStatus;
        task.CompletedAt = _clock.UtcNow;

        await WriteActionAsync(instance, task, stage, actionTypeId, request.ActorUserId, request.ActorRoleId, request.Remarks, ct);

        switch (request.ActionCode)
        {
            case WorkflowActionCode.Reject:
            case WorkflowActionCode.Void:
            case WorkflowActionCode.Cancel:
                instance.Status = "Completed";
                instance.CompletedAt = _clock.UtcNow;
                await _db.SaveChangesAsync(ct);
                return new WorkflowActionResult(true, true, stage.StageCode, null, null, Array.Empty<string>());

            case WorkflowActionCode.Return:
            case WorkflowActionCode.Query:
                // Pauses here; ResumeAsync re-opens a task at this exact stage once the
                // requester resubmits or answers the query - it never skips ahead.
                await _db.SaveChangesAsync(ct);
                return new WorkflowActionResult(false, false, stage.StageCode, null, "REQUESTOR", new[] { "View" });

            case WorkflowActionCode.Refer:
            {
                var stages = await _db.WorkflowStages.Where(s => s.DefinitionId == instance.DefinitionId).OrderBy(s => s.Sequence).ToListAsync(ct);
                var opdStage = stages.FirstOrDefault(s => s.StageCode is "APPROVE_OPD_POLICY" or "APPROVE_OPD")
                    ?? throw new InvalidOperationException("This workflow has no OPD stage to refer to.");
                await SkipStagesBetweenAsync(instance, stages, stage.Sequence, opdStage.Sequence, "Skipped due to Finance referral to OPD.", ct);
                var opdTask = await CreateTaskAsync(instance, opdStage, ct);
                await _db.SaveChangesAsync(ct);
                return new WorkflowActionResult(false, false, opdStage.StageCode, opdTask.Id, "OPD", Array.Empty<string>());
            }
        }

        var roleSet = await _bandResolver.ResolveAsync(instance.PolicyVersionId, request.CurrentAmount ?? 0, null, ct);
        var context = new StageContext(request.IsHigherQuote ?? false, request.OpdByPolicyOrReferral ?? false);
        var allStages = await _db.WorkflowStages.Where(s => s.DefinitionId == instance.DefinitionId).OrderBy(s => s.Sequence).ToListAsync(ct);
        var next = await AdvanceToNextApplicableStageAsync(instance, allStages, stage.Sequence, roleSet.Select(r => r.RoleCode).ToHashSet(StringComparer.OrdinalIgnoreCase), context, ct);

        if (next is null)
        {
            instance.Status = "Completed";
            instance.CompletedAt = _clock.UtcNow;
            await _db.SaveChangesAsync(ct);
        }

        return new WorkflowActionResult(next is null, false, next?.Stage.StageCode ?? stage.StageCode, next?.TaskId, next?.RoleCode, Array.Empty<string>());
    }

    public async Task<WorkflowStartResult> ResumeAsync(long instanceId, long actorUserId, CancellationToken ct = default)
    {
        var instance = await _db.WorkflowInstances.FirstAsync(i => i.Id == instanceId, ct);
        var returnActionId = await _lookups.IdAsync<ActionTypes, short>(WorkflowActionCode.Return, ct);
        var queryActionId = await _lookups.IdAsync<ActionTypes, short>(WorkflowActionCode.Query, ct);

        var lastAction = await _db.WorkflowActions
            .Where(a => a.InstanceId == instanceId && (a.ActionTypeId == returnActionId || a.ActionTypeId == queryActionId))
            .OrderByDescending(a => a.Id)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("Nothing to resume: this instance was never returned or queried.");

        var stage = await _db.WorkflowStages.FirstAsync(s => s.Id == lastAction.FromStageId, ct);
        var task = await CreateTaskAsync(instance, stage, ct);
        var requestorRoleId = await _lookups.IdAsync<Roles, long>("REQUESTOR", ct);
        var resubmitAction = await _lookups.IdAsync<ActionTypes, short>(WorkflowActionCode.Resubmit, ct);
        await WriteActionAsync(instance, null, stage, resubmitAction, actorUserId, requestorRoleId, "Resubmitted.", ct);

        var roleCode = stage.RoleId is null ? null : (await _db.Roles.FirstAsync(r => r.Id == stage.RoleId, ct)).Code;
        return new WorkflowStartResult(instance.Id, task.Id, stage.StageCode, roleCode);
    }

    public async Task<IReadOnlyList<string>> GetAllowedActionsAsync(long instanceId, long actorUserId, IReadOnlyCollection<long> actorRoleIds, CancellationToken ct = default)
    {
        var actionable = await GetActionableTaskAsync(instanceId, actorUserId, actorRoleIds, ct);
        if (actionable is null) return Array.Empty<string>();

        var stage = await _db.WorkflowStages.FirstAsync(s => s.Id == actionable.Task.StageId, ct);
        var stageType = await _db.StageTypes.FirstAsync(t => t.Id == stage.StageTypeId, ct);
        return stageType.Code switch
        {
            // Approval stages (HOD/Finance/Audit/OPD bands) additionally allow Query so a
            // reviewer can ask a question without having to Return it outright.
            "Approval" => new[] { WorkflowActionCode.Approve, WorkflowActionCode.Return, WorkflowActionCode.Reject, WorkflowActionCode.Query },
            // Review stages (Audit's quote review, bill review) and exception stages (the
            // OPD higher-quote exception) are decided, not "completed".
            "Review" or "Exception" => new[] { WorkflowActionCode.Approve, WorkflowActionCode.Reject, WorkflowActionCode.Query },
            _ => new[] { WorkflowActionCode.Complete },
        };
    }

    // BR-008: used by every Operational/Review/Exception/Closure stage's own dedicated
    // command (GRN, PO/contract, bill forward, audit stamp, ...) to let a legitimate
    // escalation-target actor (OPD, once the normally assigned role has missed the
    // deadline) through that command's own permission/identity gate - without this, a
    // command that only checks "does this user hold the stage's normal role-permission
    // code" would reject OPD even though AuthorizeAsync (called later, inside ExecuteAsync)
    // would correctly accept them as the escalation target. Returns false once the task is
    // no longer open (already actioned), same as GetAllowedActionsAsync.
    public async Task<bool> CanActNowAsync(long instanceId, long actorUserId, IReadOnlyCollection<long> actorRoleIds, CancellationToken ct = default) =>
        await GetActionableTaskAsync(instanceId, actorUserId, actorRoleIds, ct) is not null;

    private record ActionableTask(WorkflowTasks Task, bool IsMine, bool IsEscalationTarget);

    private async Task<ActionableTask?> GetActionableTaskAsync(long instanceId, long actorUserId, IReadOnlyCollection<long> actorRoleIds, CancellationToken ct)
    {
        var task = await _db.WorkflowTasks.Where(t => t.InstanceId == instanceId).OrderByDescending(t => t.Id).FirstOrDefaultAsync(ct);
        if (task is null) return null;
        var openStatus = await _lookups.IdAsync<TaskStatuses, short>("Open", ct);
        if (task.TaskStatusId != openStatus) return null;

        var isMine = task.AssignedUserId == actorUserId || (task.AssignedUserId is null && actorRoleIds.Contains(task.AssignedRoleId));
        var isEscalationTarget = task.EscalatedAt.HasValue && task.EscalatedToRoleId.HasValue && actorRoleIds.Contains(task.EscalatedToRoleId.Value);
        return isMine || isEscalationTarget ? new ActionableTask(task, isMine, isEscalationTarget) : null;
    }

    // ---- internals ----

    private readonly record struct StageContext(bool IsHigherQuote, bool OpdByPolicyOrReferral);

    private record StageAdvanceResult(WorkflowStages Stage, long TaskId, string? RoleCode);

    private static bool IsApprovalBandGated(string stageCode) =>
        stageCode is "APPROVE_FINANCE" or "APPROVE_AUDIT" or "APPROVE_AUDIT_BAND" or "APPROVE_HOD";

    private bool IsApplicable(WorkflowStages stage, HashSet<string> approverRoleCodes, StageContext context, Dictionary<long, string> roleCodesById)
    {
        if (IsApprovalBandGated(stage.StageCode))
            return stage.RoleId.HasValue && roleCodesById.TryGetValue(stage.RoleId.Value, out var rc) && approverRoleCodes.Contains(rc);

        return stage.StageCode switch
        {
            "APPROVE_OPD_POLICY" => approverRoleCodes.Contains("OPD") || context.OpdByPolicyOrReferral,
            "APPROVE_OPD_HIGH_QUOTE" => context.IsHigherQuote,
            _ => true,
        };
    }

    // Walks stages in sequence order past `afterSequence`. A stage with no RoleId is a pure
    // status marker (e.g. "PO_ISSUED", "WithFinancePortal") reached automatically as a side
    // effect of the previous real action - it is recorded (so WorkflowActions keeps a full
    // trail) but never gets a task, and the walk continues straight through it. A stage whose
    // condition does not apply to this PR (an amount band it doesn't fall into, an exception
    // that wasn't triggered) gets an explicit Skip action with a reason and the walk continues.
    // The first stage that is both applicable and actionable gets a real WorkflowTask, and
    // that is what makes the record "wait" there until that role acts.
    private async Task<StageAdvanceResult?> AdvanceToNextApplicableStageAsync(
        WorkflowInstances instance, List<WorkflowStages> stages, int afterSequence, HashSet<string> approverRoleCodes, StageContext context, CancellationToken ct)
    {
        var roleCodesById = await _db.Roles.ToDictionaryAsync(r => r.Id, r => r.Code, ct);
        var systemRoleId = await _lookups.IdAsync<Roles, long>("SYSTEM", ct);
        var skipType = await _lookups.IdAsync<ActionTypes, short>(WorkflowActionCode.Skip, ct);
        var completeType = await _lookups.IdAsync<ActionTypes, short>(WorkflowActionCode.Complete, ct);

        foreach (var candidate in stages.Where(s => s.Sequence > afterSequence).OrderBy(s => s.Sequence))
        {
            if (!IsApplicable(candidate, approverRoleCodes, context, roleCodesById))
            {
                await WriteActionAsync(instance, null, candidate, skipType, instance.CreatedBy, systemRoleId,
                    "Skipped - this record's amount/type does not require this stage.", ct);
                continue;
            }

            if (!candidate.RoleId.HasValue)
            {
                await WriteActionAsync(instance, null, candidate, completeType, instance.CreatedBy, systemRoleId,
                    "Reached automatically; no action required.", ct);
                continue;
            }

            var task = await CreateTaskAsync(instance, candidate, ct);
            var roleCode = roleCodesById.TryGetValue(candidate.RoleId.Value, out var rc2) ? rc2 : null;
            return new StageAdvanceResult(candidate, task.Id, roleCode);
        }
        return null;
    }

    private async Task SkipStagesBetweenAsync(WorkflowInstances instance, List<WorkflowStages> stages, int afterSequence, int beforeSequence, string reason, CancellationToken ct)
    {
        var systemRoleId = await _lookups.IdAsync<Roles, long>("SYSTEM", ct);
        var skipType = await _lookups.IdAsync<ActionTypes, short>(WorkflowActionCode.Skip, ct);
        foreach (var s in stages.Where(s => s.Sequence > afterSequence && s.Sequence < beforeSequence).OrderBy(s => s.Sequence))
            await WriteActionAsync(instance, null, s, skipType, instance.CreatedBy, systemRoleId, reason, ct);
    }

    private async Task<WorkflowTasks> CreateTaskAsync(WorkflowInstances instance, WorkflowStages stage, CancellationToken ct)
    {
        if (!stage.RoleId.HasValue)
            throw new InvalidOperationException($"Stage {stage.StageCode} has no role to assign a task to.");

        var openStatus = await _lookups.IdAsync<TaskStatuses, short>("Open", ct);
        var task = new WorkflowTasks
        {
            InstanceId = instance.Id,
            StageId = stage.Id,
            AssignedRoleId = stage.RoleId.Value,
            TaskStatusId = openStatus,
            ScopeDepartmentId = stage.ScopeType == WorkflowScopeType.FixedDepartment ? stage.ScopeDepartmentId : null,
            DueAt = stage.EscalationDays.HasValue ? _clock.UtcNow.AddDays(stage.EscalationDays.Value) : null,
            EscalatedToRoleId = stage.EscalateToRoleId,
            CreatedBy = instance.CreatedBy,
        };
        _db.Set<WorkflowTasks>().Add(task);
        instance.CurrentStageId = stage.Id;
        await _db.SaveChangesAsync(ct);
        return task;
    }

    private async Task WriteActionAsync(WorkflowInstances instance, WorkflowTasks? task, WorkflowStages? stage, short actionTypeId, long actorUserId, long actorRoleId, string? remarks, CancellationToken ct)
    {
        _db.Set<WorkflowActions>().Add(new WorkflowActions
        {
            InstanceId = instance.Id,
            TaskId = task?.Id,
            ActionTypeId = actionTypeId,
            ActorUserId = actorUserId,
            ActorRoleId = actorRoleId,
            FromStageId = instance.CurrentStageId,
            ToStageId = stage?.Id,
            Remarks = remarks,
            PolicyVersionId = instance.PolicyVersionId,
            CorrelationId = Guid.NewGuid(),
            ActedAt = _clock.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
    }

    private async Task AuthorizeAsync(WorkflowTasks task, WorkflowStages stage, ExecuteWorkflowActionRequest request, CancellationToken ct)
    {
        var isAssignedRole = task.AssignedUserId == request.ActorUserId
            || (task.AssignedUserId is null && task.AssignedRoleId == request.ActorRoleId);
        // BR-008: once a task has escalated, the stage's EscalateToRoleId (OPD by default)
        // may also act on it - the original assignee keeps the task too, it is never
        // reassigned away from them.
        var isEscalationTarget = task.EscalatedAt.HasValue && task.EscalatedToRoleId == request.ActorRoleId;
        if (!isAssignedRole && !isEscalationTarget)
            throw new UnauthorizedAccessException("It is not this user's turn on this record.");

        // Scope (Requester/Department/FixedDepartment) narrows WHO, among the normally
        // assigned role, may act - e.g. "only the requester", "only a HOD assigned to this
        // department". That question doesn't apply to an escalation-target actor: they are
        // never the requester and are rarely assigned that role for this department, yet
        // BR-008 says they may still act once the task has actually escalated to them.
        // Skipping scope here only for a pure escalation actor (not also the normal
        // assignee) is what makes escalation work at all for Requester/Department-scoped
        // stages (ACKNOWLEDGE, OWNER_UPLOAD, APPROVE_HOD) instead of this check rejecting
        // them a step after the isEscalationTarget check above just let them through.
        if (!isEscalationTarget || isAssignedRole)
        {
            switch (stage.ScopeType)
            {
                case WorkflowScopeType.Requester:
                    if (request.ActorUserId != request.RequesterUserId)
                        throw new UnauthorizedAccessException("Only the requester can act at this stage.");
                    break;
                case WorkflowScopeType.Department:
                case WorkflowScopeType.FixedDepartment:
                    var expectedDept = stage.ScopeType == WorkflowScopeType.FixedDepartment ? stage.ScopeDepartmentId : request.OwningDepartmentId;
                    var hasScope = await _db.Set<UserRoleAssignments>().AnyAsync(
                        a => a.UserId == request.ActorUserId && a.RoleId == request.ActorRoleId && a.DepartmentId == expectedDept, ct);
                    if (!hasScope)
                        throw new UnauthorizedAccessException("This user is not assigned that role for this department.");
                    break;
            }
        }

        if (stage.StageCode.StartsWith("APPROVE") && request.ActorUserId == request.RequesterUserId)
            throw new UnauthorizedAccessException("A requester cannot approve their own request.");

        if (stage.StageCode.StartsWith("APPROVE"))
        {
            var alreadyActed = await _db.WorkflowActions.AnyAsync(
                a => a.InstanceId == task.InstanceId && a.ActorUserId == request.ActorUserId && a.ToStageId != null, ct);
            if (alreadyActed)
                throw new UnauthorizedAccessException("This user has already acted on an earlier stage of this record.");
        }
    }
}
