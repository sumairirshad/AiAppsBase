using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Workflow;

public class WorkflowEngine : IWorkflowEngine
{
    private readonly IProcurementDbContext _db;

    public WorkflowEngine(IProcurementDbContext db) => _db = db;

    public async Task<WorkflowInstances> StartAsync(
        string definitionCode, short entityTypeId, long entityId, long policyVersionId,
        IDictionary<string, object> context, long actorUserId, long actorRoleId, CancellationToken ct)
    {
        var definition = await _db.WorkflowDefinitions
            .Include(d => d.Stages)
            .FirstOrDefaultAsync(d => d.Code == definitionCode && d.IsActive, ct)
            ?? throw new NotFoundException("WorkflowDefinition", definitionCode);

        var now = DateTime.UtcNow;
        var instance = new WorkflowInstances
        {
            DefinitionId = definition.Id,
            EntityTypeId = entityTypeId,
            EntityId = entityId,
            Status = "Running",
            PolicyVersionId = policyVersionId,
            StartedAt = now,
            CreatedByUserId = actorUserId,
            CreatedAt = now,
        };
        _db.WorkflowInstances.Add(instance);
        await _db.SaveChangesAsync(ct);

        var orderedStages = definition.Stages.OrderBy(s => s.Sequence).ToList();
        var found = await ResolveNextStageAsync(instance, orderedStages, fromSequence: 1, context, actorUserId, actorRoleId, ct);

        var submitActionTypeId = await LookupIdAsync(_db.ActionTypes, ActionTypeCodes.Submit, ct);
        _db.WorkflowActions.Add(new WorkflowActions
        {
            InstanceId = instance.Id,
            ActionTypeId = submitActionTypeId,
            ActorUserId = actorUserId,
            ActorRoleId = actorRoleId,
            FromStageId = null,
            ToStageId = found?.Id,
            Remarks = null,
            PolicyVersionId = policyVersionId,
            CorrelationId = Guid.NewGuid(),
            ActedAt = now,
        });

        await ApplyResolvedStageAsync(instance, found, context, ct);
        await _db.SaveChangesAsync(ct);
        return instance;
    }

    public async Task<WorkflowAdvanceResult> AdvanceAsync(
        long instanceId, string actionTypeCode, long actorUserId, long actorRoleId,
        string? remarks, IDictionary<string, object> context, CancellationToken ct)
    {
        var (instance, currentStage) = await LoadRunningInstanceAsync(instanceId, ct);

        await CompleteCurrentTaskAsync(instance, currentStage, ct);

        var allStages = await _db.WorkflowStages.Where(s => s.DefinitionId == currentStage.DefinitionId).OrderBy(s => s.Sequence).ToListAsync(ct);
        var found = await ResolveNextStageAsync(instance, allStages, currentStage.Sequence + 1, context, actorUserId, actorRoleId, ct);

        var actionTypeId = await LookupIdAsync(_db.ActionTypes, actionTypeCode, ct);
        _db.WorkflowActions.Add(new WorkflowActions
        {
            InstanceId = instance.Id,
            ActionTypeId = actionTypeId,
            ActorUserId = actorUserId,
            ActorRoleId = actorRoleId,
            FromStageId = currentStage.Id,
            ToStageId = found?.Id,
            Remarks = remarks,
            PolicyVersionId = instance.PolicyVersionId,
            CorrelationId = Guid.NewGuid(),
            ActedAt = DateTime.UtcNow,
        });

        var completed = await ApplyResolvedStageAsync(instance, found, context, ct);
        await _db.SaveChangesAsync(ct);
        return new WorkflowAdvanceResult(completed ? null : found, completed);
    }

    public async Task TerminateAsync(
        long instanceId, string actionTypeCode, long actorUserId, long actorRoleId, string? remarks, CancellationToken ct)
    {
        var (instance, currentStage) = await LoadRunningInstanceAsync(instanceId, ct);
        await CompleteCurrentTaskAsync(instance, currentStage, ct);

        var actionTypeId = await LookupIdAsync(_db.ActionTypes, actionTypeCode, ct);
        _db.WorkflowActions.Add(new WorkflowActions
        {
            InstanceId = instance.Id,
            ActionTypeId = actionTypeId,
            ActorUserId = actorUserId,
            ActorRoleId = actorRoleId,
            FromStageId = currentStage.Id,
            ToStageId = null,
            Remarks = remarks,
            PolicyVersionId = instance.PolicyVersionId,
            CorrelationId = Guid.NewGuid(),
            ActedAt = DateTime.UtcNow,
        });

        instance.Status = "Cancelled";
        instance.CompletedAt = DateTime.UtcNow;
        instance.CurrentStageId = null;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<WorkflowTasks?> GetOpenTaskAsync(long instanceId, CancellationToken ct)
    {
        var openStatusId = await LookupIdAsync(_db.TaskStatuses, TaskStatusCodes.Open, ct);
        return await _db.WorkflowTasks
            .Where(t => t.InstanceId == instanceId && t.TaskStatusId == openStatusId)
            .OrderByDescending(t => t.Id)
            .FirstOrDefaultAsync(ct);
    }

    private async Task<(WorkflowInstances Instance, WorkflowStages CurrentStage)> LoadRunningInstanceAsync(long instanceId, CancellationToken ct)
    {
        var instance = await _db.WorkflowInstances.FirstOrDefaultAsync(i => i.Id == instanceId, ct)
            ?? throw new NotFoundException("WorkflowInstance", instanceId);

        if (instance.Status != "Running")
        {
            throw new BusinessRuleException($"Workflow instance {instanceId} is not running.");
        }

        var currentStage = instance.CurrentStageId == null
            ? null
            : await _db.WorkflowStages.FirstOrDefaultAsync(s => s.Id == instance.CurrentStageId, ct);

        if (currentStage == null)
        {
            throw new BusinessRuleException($"Workflow instance {instanceId} has no current stage to act on.");
        }

        return (instance, currentStage);
    }

    private async Task CompleteCurrentTaskAsync(WorkflowInstances instance, WorkflowStages currentStage, CancellationToken ct)
    {
        var openStatusId = await LookupIdAsync(_db.TaskStatuses, TaskStatusCodes.Open, ct);
        var openTask = await _db.WorkflowTasks.FirstOrDefaultAsync(
            t => t.InstanceId == instance.Id && t.StageId == currentStage.Id && t.TaskStatusId == openStatusId, ct);

        if (openTask != null)
        {
            openTask.TaskStatusId = await LookupIdAsync(_db.TaskStatuses, TaskStatusCodes.Completed, ct);
            openTask.CompletedAt = DateTime.UtcNow;
        }
    }

    /// <summary>Scans forward from <paramref name="fromSequence"/>, recording a Skip action for every stage
    /// whose condition is false, and returns the first stage whose condition holds (or null at the end).</summary>
    private async Task<WorkflowStages?> ResolveNextStageAsync(
        WorkflowInstances instance, List<WorkflowStages> orderedStages, int fromSequence,
        IDictionary<string, object> context, long actorUserId, long actorRoleId, CancellationToken ct)
    {
        var policySettings = await LoadPolicySettingsAsync(instance.PolicyVersionId, ct);
        var evaluator = new ConditionEvaluator(context.ToDictionary(kv => kv.Key, kv => kv.Value), policySettings);
        var skipActionTypeId = await LookupIdAsync(_db.ActionTypes, ActionTypeCodes.Skip, ct);
        var now = DateTime.UtcNow;

        foreach (var stage in orderedStages.Where(s => s.Sequence >= fromSequence))
        {
            if (evaluator.Evaluate(stage.ConditionExpr))
            {
                return stage;
            }

            _db.WorkflowActions.Add(new WorkflowActions
            {
                InstanceId = instance.Id,
                ActionTypeId = skipActionTypeId,
                ActorUserId = actorUserId,
                ActorRoleId = actorRoleId,
                FromStageId = stage.Id,
                ToStageId = null,
                Remarks = $"Condition not met: {stage.ConditionExpr}",
                PolicyVersionId = instance.PolicyVersionId,
                CorrelationId = Guid.NewGuid(),
                ActedAt = now,
            });
        }

        return null;
    }

    /// <summary>Given the resolved next stage (or null), either completes the instance (null, or a Closure-type
    /// stage - no task is created for Closure stages) or activates a task for it. Returns true if completed.</summary>
    private async Task<bool> ApplyResolvedStageAsync(
        WorkflowInstances instance, WorkflowStages? stage, IDictionary<string, object> context, CancellationToken ct)
    {
        var closureStageTypeId = await LookupIdAsync(_db.StageTypes, StageTypeCodes.Closure, ct);
        var now = DateTime.UtcNow;

        if (stage == null || stage.StageTypeId == closureStageTypeId)
        {
            instance.CurrentStageId = stage?.Id;
            instance.Status = "Completed";
            instance.CompletedAt = now;
            return true;
        }

        instance.CurrentStageId = stage.Id;
        await ActivateStageAsync(instance, stage, context, ct);
        return false;
    }

    private async Task ActivateStageAsync(WorkflowInstances instance, WorkflowStages stage, IDictionary<string, object> context, CancellationToken ct)
    {
        long? assignedUserId = null;
        long? scopeDepartmentId = null;

        switch (stage.ScopeType)
        {
            case WorkflowStageScopeTypes.Department:
                if (context.TryGetValue("DepartmentId", out var deptObj)) scopeDepartmentId = Convert.ToInt64(deptObj);
                break;
            case WorkflowStageScopeTypes.Requester:
                if (context.TryGetValue("RequesterId", out var reqObj)) assignedUserId = Convert.ToInt64(reqObj);
                break;
            case WorkflowStageScopeTypes.FixedDepartment:
                scopeDepartmentId = stage.ScopeDepartmentId;
                break;
        }

        var policySettings = await LoadPolicySettingsAsync(instance.PolicyVersionId, ct);
        var escalationDays = stage.EscalationDays
            ?? (policySettings.TryGetValue(PolicySettingKeys.DefaultEscalationDays, out var d) ? int.Parse(d) : 3);

        var openStatusId = await LookupIdAsync(_db.TaskStatuses, TaskStatusCodes.Open, ct);
        var now = DateTime.UtcNow;

        _db.WorkflowTasks.Add(new WorkflowTasks
        {
            InstanceId = instance.Id,
            StageId = stage.Id,
            AssignedRoleId = stage.RoleId ?? await LookupIdAsync(_db.Roles, RoleCodes.System, ct),
            AssignedUserId = assignedUserId,
            ScopeDepartmentId = scopeDepartmentId,
            TaskStatusId = openStatusId,
            DueAt = now.AddDays(escalationDays),
            CreatedByUserId = instance.CreatedByUserId,
            CreatedAt = now,
        });
    }

    private async Task<IReadOnlyDictionary<string, string>> LoadPolicySettingsAsync(long policyVersionId, CancellationToken ct)
    {
        return await _db.PolicySettings
            .Where(p => p.PolicyVersionId == policyVersionId)
            .ToDictionaryAsync(p => p.SettingKey, p => p.Value, ct);
    }

    private static async Task<short> LookupIdAsync(Microsoft.EntityFrameworkCore.DbSet<ActionTypes> set, string code, CancellationToken ct) =>
        (await set.FirstAsync(x => x.Code == code, ct)).Id;

    private static async Task<short> LookupIdAsync(Microsoft.EntityFrameworkCore.DbSet<TaskStatuses> set, string code, CancellationToken ct) =>
        (await set.FirstAsync(x => x.Code == code, ct)).Id;

    private static async Task<short> LookupIdAsync(Microsoft.EntityFrameworkCore.DbSet<StageTypes> set, string code, CancellationToken ct) =>
        (await set.FirstAsync(x => x.Code == code, ct)).Id;

    private static async Task<long> LookupIdAsync(Microsoft.EntityFrameworkCore.DbSet<Roles> set, string code, CancellationToken ct) =>
        (await set.FirstAsync(x => x.Code == code, ct)).Id;
}
