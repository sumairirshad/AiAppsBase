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

        var policySettings = await LoadPolicySettingsAsync(policyVersionId, ct);
        var correlationId = Guid.NewGuid();
        var orderedStages = definition.Stages.OrderBy(s => s.Sequence).ToList();

        var nextActiveStage = await ScanForwardAsync(orderedStages, fromSequence: 1, context, policySettings, instance.Id, actorUserId, actorRoleId, correlationId, policyVersionId, ct);

        var submitActionTypeId = await LookupIdAsync(_db.ActionTypes, ActionTypeCodes.Submit, ct);
        _db.WorkflowActions.Add(new WorkflowActions
        {
            InstanceId = instance.Id,
            ActionTypeId = submitActionTypeId,
            ActorUserId = actorUserId,
            ActorRoleId = actorRoleId,
            FromStageId = null,
            ToStageId = nextActiveStage?.Id,
            Remarks = null,
            PolicyVersionId = policyVersionId,
            CorrelationId = correlationId,
            ActedAt = now,
        });

        if (nextActiveStage != null)
        {
            instance.CurrentStageId = nextActiveStage.Id;
            await ActivateStageAsync(instance, nextActiveStage, context, policySettings, ct);
        }
        else
        {
            instance.Status = "Completed";
            instance.CompletedAt = now;
        }

        await _db.SaveChangesAsync(ct);
        return instance;
    }

    public async Task<WorkflowAdvanceResult> AdvanceAsync(
        long instanceId, string actionTypeCode, long actorUserId, long actorRoleId,
        string? remarks, IDictionary<string, object> context, CancellationToken ct)
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
            throw new BusinessRuleException($"Workflow instance {instanceId} has no current stage to advance from.");
        }

        var openStatusId = await LookupIdAsync(_db.TaskStatuses, TaskStatusCodes.Open, ct);
        var openTask = await _db.WorkflowTasks.FirstOrDefaultAsync(
            t => t.InstanceId == instanceId && t.StageId == currentStage.Id && t.TaskStatusId == openStatusId, ct);

        var now = DateTime.UtcNow;
        if (openTask != null)
        {
            openTask.TaskStatusId = await LookupIdAsync(_db.TaskStatuses, TaskStatusCodes.Completed, ct);
            openTask.CompletedAt = now;
        }

        var allStages = await _db.WorkflowStages.Where(s => s.DefinitionId == currentStage.DefinitionId).OrderBy(s => s.Sequence).ToListAsync(ct);
        var policySettings = await LoadPolicySettingsAsync(instance.PolicyVersionId, ct);
        var correlationId = Guid.NewGuid();

        var nextActiveStage = await ScanForwardAsync(allStages, currentStage.Sequence + 1, context, policySettings, instance.Id, actorUserId, actorRoleId, correlationId, instance.PolicyVersionId, ct);

        var actionTypeId = await LookupIdAsync(_db.ActionTypes, actionTypeCode, ct);
        _db.WorkflowActions.Add(new WorkflowActions
        {
            InstanceId = instance.Id,
            ActionTypeId = actionTypeId,
            ActorUserId = actorUserId,
            ActorRoleId = actorRoleId,
            FromStageId = currentStage.Id,
            ToStageId = nextActiveStage?.Id,
            Remarks = remarks,
            PolicyVersionId = instance.PolicyVersionId,
            CorrelationId = correlationId,
            ActedAt = now,
        });

        bool completed;
        if (nextActiveStage != null)
        {
            instance.CurrentStageId = nextActiveStage.Id;
            await ActivateStageAsync(instance, nextActiveStage, context, policySettings, ct);
            completed = false;
        }
        else
        {
            instance.Status = "Completed";
            instance.CompletedAt = now;
            instance.CurrentStageId = null;
            completed = true;
        }

        await _db.SaveChangesAsync(ct);
        return new WorkflowAdvanceResult(nextActiveStage, completed);
    }

    public async Task<WorkflowTasks?> GetOpenTaskAsync(long instanceId, CancellationToken ct)
    {
        var openStatusId = await LookupIdAsync(_db.TaskStatuses, TaskStatusCodes.Open, ct);
        return await _db.WorkflowTasks
            .Where(t => t.InstanceId == instanceId && t.TaskStatusId == openStatusId)
            .OrderByDescending(t => t.Id)
            .FirstOrDefaultAsync(ct);
    }

    private async Task<WorkflowStages?> ScanForwardAsync(
        List<WorkflowStages> orderedStages, int fromSequence, IDictionary<string, object> context,
        IReadOnlyDictionary<string, string> policySettings, long instanceId, long actorUserId, long actorRoleId,
        Guid correlationId, long policyVersionId, CancellationToken ct)
    {
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
                InstanceId = instanceId,
                ActionTypeId = skipActionTypeId,
                ActorUserId = actorUserId,
                ActorRoleId = actorRoleId,
                FromStageId = stage.Id,
                ToStageId = null,
                Remarks = $"Condition not met: {stage.ConditionExpr}",
                PolicyVersionId = policyVersionId,
                CorrelationId = correlationId,
                ActedAt = now,
            });
        }

        return null;
    }

    private async Task ActivateStageAsync(
        WorkflowInstances instance, WorkflowStages stage, IDictionary<string, object> context,
        IReadOnlyDictionary<string, string> policySettings, CancellationToken ct)
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

    private static async Task<long> LookupIdAsync(Microsoft.EntityFrameworkCore.DbSet<Roles> set, string code, CancellationToken ct) =>
        (await set.FirstAsync(x => x.Code == code, ct)).Id;
}
