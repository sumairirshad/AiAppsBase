using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Application.Tests.Workflow;

// Exercises the generic WorkflowEngine against an in-memory approval chain shaped exactly
// like WF_SOURCING's HOD -> Finance -> Audit band, which is the part of the spec the user
// called out explicitly: every required approver must get a task, in order, and the record
// must stay pending until all of them have acted - never fewer, never out of order.
public class WorkflowEngineTests
{
    private const long DeptId = 1;
    private const long RequesterId = 10;
    private const long HodUserId = 20;
    private const long FinanceUserId = 30;
    private const long AuditUserId = 40;

    private const long OpdUserId = 50;
    private long _hodRoleId, _financeRoleId, _auditRoleId, _requestorRoleId, _systemRoleId, _opdRoleId;
    private long _policyVersionId;
    private long _definitionId;

    private async Task<ProcurementDbContext> BuildContextAsync()
    {
        var options = new DbContextOptionsBuilder<ProcurementDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var db = new ProcurementDbContext(options);

        // ---- minimal lookups the engine reads by Code ----
        db.ActionTypes.AddRange(
            new ActionTypes { Code = "Submit", Name = "Submit" },
            new ActionTypes { Code = "Approve", Name = "Approve" },
            new ActionTypes { Code = "Reject", Name = "Reject" },
            new ActionTypes { Code = "Return", Name = "Return" },
            new ActionTypes { Code = "Query", Name = "Query" },
            new ActionTypes { Code = "Refer", Name = "Refer" },
            new ActionTypes { Code = "Skip", Name = "Skip" },
            new ActionTypes { Code = "Complete", Name = "Complete" },
            new ActionTypes { Code = "Override", Name = "Override" },
            new ActionTypes { Code = "ForceRevert", Name = "ForceRevert" },
            new ActionTypes { Code = "Void", Name = "Void" },
            new ActionTypes { Code = "Cancel", Name = "Cancel" }
        );
        db.TaskStatuses.AddRange(
            new TaskStatuses { Code = "Open", Name = "Open" },
            new TaskStatuses { Code = "Completed", Name = "Completed" }
        );
        db.StageTypes.AddRange(
            new StageTypes { Code = "Approval", Name = "Approval" },
            new StageTypes { Code = "Operational", Name = "Operational" }
        );
        db.EntityTypes.Add(new EntityTypes { Code = "PurchaseRequisition", Name = "PR" });
        await db.SaveChangesAsync();

        db.Roles.AddRange(
            new Roles { Code = "REQUESTOR", Name = "Requestor" },
            new Roles { Code = "HOD", Name = "HOD" },
            new Roles { Code = "FINANCE", Name = "Finance" },
            new Roles { Code = "AUDIT", Name = "Audit" },
            new Roles { Code = "OPD", Name = "OPD" },
            new Roles { Code = "SYSTEM", Name = "System" }
        );
        await db.SaveChangesAsync();
        _requestorRoleId = db.Roles.Single(r => r.Code == "REQUESTOR").Id;
        _hodRoleId = db.Roles.Single(r => r.Code == "HOD").Id;
        _financeRoleId = db.Roles.Single(r => r.Code == "FINANCE").Id;
        _auditRoleId = db.Roles.Single(r => r.Code == "AUDIT").Id;
        _systemRoleId = db.Roles.Single(r => r.Code == "SYSTEM").Id;
        _opdRoleId = db.Roles.Single(r => r.Code == "OPD").Id;

        db.Departments.Add(new Departments { Id = DeptId, Code = "IT", Name = "IT", CreatedBy = RequesterId });
        db.Users.AddRange(
            new Users { Id = RequesterId, EmployeeNo = "E10", DisplayName = "Req", Email = "req@t", DepartmentId = DeptId, CreatedBy = RequesterId },
            new Users { Id = HodUserId, EmployeeNo = "E20", DisplayName = "Hod", Email = "hod@t", DepartmentId = DeptId, CreatedBy = RequesterId },
            new Users { Id = FinanceUserId, EmployeeNo = "E30", DisplayName = "Fin", Email = "fin@t", DepartmentId = DeptId, CreatedBy = RequesterId },
            new Users { Id = AuditUserId, EmployeeNo = "E40", DisplayName = "Aud", Email = "aud@t", DepartmentId = DeptId, CreatedBy = RequesterId },
            // OPD is not assigned to any specific department - they oversee all of them, so
            // they hold no Department-scoped UserRoleAssignments row at all. That is exactly
            // what makes the escalation-scope-bypass fix necessary to test.
            new Users { Id = OpdUserId, EmployeeNo = "E50", DisplayName = "Opd", Email = "opd@t", DepartmentId = DeptId, CreatedBy = RequesterId }
        );
        db.UserRoleAssignments.Add(new UserRoleAssignments { UserId = HodUserId, RoleId = _hodRoleId, DepartmentId = DeptId, ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = RequesterId });
        await db.SaveChangesAsync();

        // ---- policy: the real seeded bands (0-1M HOD; 1M-5M HOD+FIN; >5M HOD+FIN+AUDIT) ----
        db.PolicyVersions.Add(new PolicyVersions { VersionNo = 1, EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), StatusId = 1, ChangeReason = "test", CreatedBy = RequesterId });
        await db.SaveChangesAsync();
        _policyVersionId = db.PolicyVersions.Single().Id;

        db.ApprovalBands.AddRange(
            new ApprovalBands { PolicyVersionId = _policyVersionId, MinAmount = 0, MaxAmount = 1_000_000, Sequence = 1, RoleId = _hodRoleId, CreatedBy = RequesterId },
            new ApprovalBands { PolicyVersionId = _policyVersionId, MinAmount = 1_000_000.01m, MaxAmount = 5_000_000, Sequence = 1, RoleId = _hodRoleId, CreatedBy = RequesterId },
            new ApprovalBands { PolicyVersionId = _policyVersionId, MinAmount = 1_000_000.01m, MaxAmount = 5_000_000, Sequence = 2, RoleId = _financeRoleId, CreatedBy = RequesterId },
            new ApprovalBands { PolicyVersionId = _policyVersionId, MinAmount = 5_000_000.01m, MaxAmount = null, Sequence = 1, RoleId = _hodRoleId, CreatedBy = RequesterId },
            new ApprovalBands { PolicyVersionId = _policyVersionId, MinAmount = 5_000_000.01m, MaxAmount = null, Sequence = 2, RoleId = _financeRoleId, CreatedBy = RequesterId },
            new ApprovalBands { PolicyVersionId = _policyVersionId, MinAmount = 5_000_000.01m, MaxAmount = null, Sequence = 3, RoleId = _auditRoleId, CreatedBy = RequesterId }
        );
        await db.SaveChangesAsync();

        // ---- workflow definition shaped like WF_SOURCING's approval chain + one closing operational stage ----
        db.WorkflowDefinitions.Add(new WorkflowDefinitions { Code = "WF_TEST", Name = "Test", EntityTypeId = 1, Version = 1, ActiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = RequesterId });
        await db.SaveChangesAsync();
        _definitionId = db.WorkflowDefinitions.Single().Id;

        db.WorkflowStages.AddRange(
            new WorkflowStages { DefinitionId = _definitionId, StageCode = "APPROVE_HOD", Sequence = 20, StageTypeId = 1, RoleId = _hodRoleId, ScopeType = "Department", CreatedBy = RequesterId },
            new WorkflowStages { DefinitionId = _definitionId, StageCode = "APPROVE_FINANCE", Sequence = 30, StageTypeId = 1, RoleId = _financeRoleId, CreatedBy = RequesterId },
            new WorkflowStages { DefinitionId = _definitionId, StageCode = "APPROVE_AUDIT", Sequence = 40, StageTypeId = 1, RoleId = _auditRoleId, CreatedBy = RequesterId },
            new WorkflowStages { DefinitionId = _definitionId, StageCode = "PROCUREMENT_ACCEPT", Sequence = 50, StageTypeId = 2, RoleId = _financeRoleId, CreatedBy = RequesterId }
        );
        await db.SaveChangesAsync();

        return db;
    }

    private static WorkflowEngine CreateEngine(ProcurementDbContext db) =>
        new(db, new ApprovalBandResolver(db), new LookupCache(db), new TestClock());

    private async Task<long> StartAsync(ProcurementDbContext db, WorkflowEngine engine, decimal amount)
    {
        var result = await engine.StartAsync(new StartWorkflowRequest(
            "WF_TEST", EntityId: 999, ActorUserId: RequesterId, ActorRoleId: _requestorRoleId,
            PolicyVersionId: _policyVersionId, Amount: amount, SpendSubHeadId: null,
            OwningDepartmentId: DeptId, RequesterUserId: RequesterId));
        return result.InstanceId;
    }

    [Fact]
    public async Task Low_value_pr_only_needs_HOD()
    {
        var db = await BuildContextAsync();
        var engine = CreateEngine(db);
        var instanceId = await StartAsync(db, engine, 500_000);

        var tasksAfterStart = await db.WorkflowTasks.Where(t => t.InstanceId == instanceId).ToListAsync();
        tasksAfterStart.Should().HaveCount(1);
        tasksAfterStart[0].AssignedRoleId.Should().Be(_hodRoleId);

        var result = await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(
            instanceId, HodUserId, _hodRoleId, WorkflowActionCode.Approve, RequesterId, DeptId, CurrentAmount: 500_000));

        result.CurrentStageCode.Should().Be("PROCUREMENT_ACCEPT");
        (await db.WorkflowInstances.FindAsync(instanceId))!.Status.Should().Be("Running");
    }

    [Fact]
    public async Task Mid_value_pr_requires_HOD_then_Finance_and_stays_pending_between_them()
    {
        var db = await BuildContextAsync();
        var engine = CreateEngine(db);
        var instanceId = await StartAsync(db, engine, 2_000_000);

        await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(
            instanceId, HodUserId, _hodRoleId, WorkflowActionCode.Approve, RequesterId, DeptId, CurrentAmount: 2_000_000));

        var instance = await db.WorkflowInstances.FindAsync(instanceId);
        instance!.Status.Should().Be("Running", "Finance still has to approve - the record must not auto-complete.");

        var openStatusId = db.TaskStatuses.Single(s => s.Code == "Open").Id;
        var openTasks = await db.WorkflowTasks.Where(t => t.InstanceId == instanceId && t.TaskStatusId == openStatusId).ToListAsync();
        openTasks.Should().ContainSingle(t => t.AssignedRoleId == _financeRoleId);
    }

    [Fact]
    public async Task High_value_pr_requires_all_three_approvers_in_order_before_completing()
    {
        var db = await BuildContextAsync();
        var engine = CreateEngine(db);
        var instanceId = await StartAsync(db, engine, 10_000_000);

        await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(instanceId, HodUserId, _hodRoleId, WorkflowActionCode.Approve, RequesterId, DeptId, CurrentAmount: 10_000_000));
        (await db.WorkflowInstances.FindAsync(instanceId))!.Status.Should().Be("Running");

        await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(instanceId, FinanceUserId, _financeRoleId, WorkflowActionCode.Approve, RequesterId, DeptId, CurrentAmount: 10_000_000));
        (await db.WorkflowInstances.FindAsync(instanceId))!.Status.Should().Be("Running", "Audit still has to approve above 50 lac.");

        var final = await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(instanceId, AuditUserId, _auditRoleId, WorkflowActionCode.Approve, RequesterId, DeptId, CurrentAmount: 10_000_000));
        final.CurrentStageCode.Should().Be("PROCUREMENT_ACCEPT");
    }

    [Fact]
    public async Task Requester_cannot_approve_their_own_request()
    {
        var db = await BuildContextAsync();
        var engine = CreateEngine(db);
        db.UserRoleAssignments.Add(new UserRoleAssignments { UserId = RequesterId, RoleId = _hodRoleId, DepartmentId = DeptId, ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = RequesterId });
        await db.SaveChangesAsync();
        var instanceId = await StartAsync(db, engine, 500_000);

        var act = async () => await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(
            instanceId, RequesterId, _hodRoleId, WorkflowActionCode.Approve, RequesterId, DeptId, CurrentAmount: 500_000));

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Same_user_cannot_act_on_two_approval_stages_of_the_same_record()
    {
        var db = await BuildContextAsync();
        var engine = CreateEngine(db);
        // HodUserId also holds the Finance role (dual-role user, a realistic scenario).
        db.UserRoleAssignments.Add(new UserRoleAssignments { UserId = HodUserId, RoleId = _financeRoleId, ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = RequesterId });
        await db.SaveChangesAsync();
        var instanceId = await StartAsync(db, engine, 2_000_000);

        await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(instanceId, HodUserId, _hodRoleId, WorkflowActionCode.Approve, RequesterId, DeptId, CurrentAmount: 2_000_000));

        var act = async () => await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(
            instanceId, HodUserId, _financeRoleId, WorkflowActionCode.Approve, RequesterId, DeptId, CurrentAmount: 2_000_000));

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task Reject_requires_remarks()
    {
        var db = await BuildContextAsync();
        var engine = CreateEngine(db);
        var instanceId = await StartAsync(db, engine, 500_000);

        var act = async () => await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(
            instanceId, HodUserId, _hodRoleId, WorkflowActionCode.Reject, RequesterId, DeptId, Remarks: null, CurrentAmount: 500_000));

        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task Reject_is_terminal()
    {
        var db = await BuildContextAsync();
        var engine = CreateEngine(db);
        var instanceId = await StartAsync(db, engine, 500_000);

        var result = await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(
            instanceId, HodUserId, _hodRoleId, WorkflowActionCode.Reject, RequesterId, DeptId, Remarks: "Not justified.", CurrentAmount: 500_000));

        result.Rejected.Should().BeTrue();
        (await db.WorkflowInstances.FindAsync(instanceId))!.Status.Should().Be("Completed");
    }

    [Fact]
    public async Task Wrong_role_cannot_act_on_someone_elses_task()
    {
        var db = await BuildContextAsync();
        var engine = CreateEngine(db);
        var instanceId = await StartAsync(db, engine, 500_000);

        var act = async () => await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(
            instanceId, FinanceUserId, _financeRoleId, WorkflowActionCode.Approve, RequesterId, DeptId, CurrentAmount: 500_000));

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    // BR-008 regression: APPROVE_HOD is Department-scoped, and OPD holds no department-scoped
    // assignment at all (they oversee every department) - a scope check that still ran for an
    // escalation-target actor would always reject OPD here, which is exactly the bug this
    // guards against. Mirrors what the Worker's EscalationWatch job does when HOD misses the
    // stage's EscalationDays deadline: stamp EscalatedAt/EscalatedToRoleId on the open task.
    [Fact]
    public async Task Escalated_task_can_be_actioned_by_the_escalation_target_despite_department_scope()
    {
        var db = await BuildContextAsync();
        var engine = CreateEngine(db);
        var instanceId = await StartAsync(db, engine, 500_000);

        var openTask = await db.WorkflowTasks.SingleAsync(t => t.InstanceId == instanceId);
        openTask.EscalatedAt = new DateTime(2026, 1, 4, 0, 0, 0, DateTimeKind.Utc);
        openTask.EscalatedToRoleId = _opdRoleId;
        await db.SaveChangesAsync();

        (await engine.CanActNowAsync(instanceId, OpdUserId, new[] { _opdRoleId })).Should().BeTrue();
        (await engine.CanActNowAsync(instanceId, OpdUserId, new[] { _financeRoleId })).Should().BeFalse("holding an unrelated role is not enough");

        var result = await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(
            instanceId, OpdUserId, _opdRoleId, WorkflowActionCode.Approve, RequesterId, DeptId, CurrentAmount: 500_000));

        result.CurrentStageCode.Should().Be("PROCUREMENT_ACCEPT");

        var action = await db.WorkflowActions.OrderByDescending(a => a.Id).FirstAsync(a => a.TaskId == openTask.Id);
        action.ActorUserId.Should().Be(OpdUserId, "the original HOD assignee must stay on record as never having acted - OPD acted instead");
    }

    // The original assignee is never unauthorized by this fix - escalation only ADDS OPD as
    // an alternate actor, it never removes the department-scoped HOD's own ability to act.
    [Fact]
    public async Task Escalation_does_not_remove_the_original_assignees_own_scope_check()
    {
        var db = await BuildContextAsync();
        var engine = CreateEngine(db);
        var instanceId = await StartAsync(db, engine, 500_000);

        var openTask = await db.WorkflowTasks.SingleAsync(t => t.InstanceId == instanceId);
        openTask.EscalatedAt = new DateTime(2026, 1, 4, 0, 0, 0, DateTimeKind.Utc);
        openTask.EscalatedToRoleId = _opdRoleId;
        await db.SaveChangesAsync();

        // HodUserId is only assigned the HOD role for DeptId - still fine, still scoped.
        var result = await engine.ExecuteAsync(new ExecuteWorkflowActionRequest(
            instanceId, HodUserId, _hodRoleId, WorkflowActionCode.Approve, RequesterId, DeptId, CurrentAmount: 500_000));
        result.CurrentStageCode.Should().Be("PROCUREMENT_ACCEPT");
    }

    private class TestClock : Procurement.Application.Common.Interfaces.IDateTimeProvider
    {
        public DateTime UtcNow => new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
    }
}
