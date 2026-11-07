using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Policy;
using Procurement.Application.Requisitions;
using Procurement.Application.Sourcing;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;
using Procurement.Infrastructure.Persistence;
using Procurement.Infrastructure.Persistence.Seed;

namespace Procurement.Application.Tests.Requisitions;

// The single most direct test of the behaviour the spec calls out explicitly: raise a real
// Fault PR, submit it, and watch it require every approver in sequence - never fewer, never
// skipped - before the system automatically moves it on to Procurement. This reuses the real
// production seeders (RoleSeeder/PolicySeeder/WorkflowSeeder/SpendTaxonomySeeder) against an
// in-memory database, so it also doubles as a check that those seeders themselves are correct
// (only LookupSeeder/BootstrapSeeder are skipped, since they use raw SQL the InMemory provider
// can't run - their rows are inserted directly instead).
public class PrLifecycleEndToEndTests
{
    private const long SystemUserId = 1;
    private const long ItDeptId = 10;
    private const long ProcDeptId = 11;
    private const long RequesterId = 100;
    private const long HodUserId = 101;
    private const long FinanceUserId = 102;
    private const long AuditUserId = 103;
    private const long ProcurementUserId = 104;

    private class FakeNumberGenerator : IDocumentNumberGenerator
    {
        private int _n;
        public Task<string> NextAsync(DocumentSequence sequence, CancellationToken ct = default) =>
            Task.FromResult($"{sequence}-{++_n:D5}");
    }

    private class FixedClock : IDateTimeProvider
    {
        public DateTime UtcNow => new(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc);
    }

    private async Task<ProcurementDbContext> BuildAsync()
    {
        var options = new DbContextOptionsBuilder<ProcurementDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var db = new ProcurementDbContext(options);

        // Minimal lookup rows the seeders and handlers need (LookupSeeder itself uses raw SQL
        // MERGE, which the InMemory provider can't run).
        db.PrStatuses.AddRange(
            new PrStatuses { Code = "Draft", Name = "Draft" }, new PrStatuses { Code = "PendingHod", Name = "Pending HOD" },
            new PrStatuses { Code = "PendingFinance", Name = "Pending Finance" }, new PrStatuses { Code = "PendingAudit", Name = "Pending Audit" },
            new PrStatuses { Code = "PendingOpd", Name = "Pending OPD" }, new PrStatuses { Code = "PendingProcurement", Name = "Pending Procurement" },
            new PrStatuses { Code = "PendingQuotations", Name = "Pending Quotations" }, new PrStatuses { Code = "Rejected", Name = "Rejected", IsTerminal = true },
            new PrStatuses { Code = "Returned", Name = "Returned" }, new PrStatuses { Code = "Queried", Name = "Queried" },
            new PrStatuses { Code = "Closed", Name = "Closed", IsTerminal = true }
        );
        db.CostTypes.AddRange(new CostTypes { Code = "Final", Name = "Final" }, new CostTypes { Code = "Tentative", Name = "Tentative" });
        db.ProcurementModes.AddRange(
            new ProcurementModes { Code = "Sourcing", Name = "Sourcing" }, new ProcurementModes { Code = "Bill", Name = "Bill" },
            new ProcurementModes { Code = "PolicyClaim", Name = "Policy Claim" }, new ProcurementModes { Code = "RecurringBill", Name = "Recurring Bill" },
            new ProcurementModes { Code = "RecurringItems", Name = "Recurring Items" });
        db.ActionTypes.AddRange(
            new ActionTypes { Code = "Submit" }, new ActionTypes { Code = "Approve" }, new ActionTypes { Code = "Reject" },
            new ActionTypes { Code = "Return" }, new ActionTypes { Code = "Query" }, new ActionTypes { Code = "Refer" },
            new ActionTypes { Code = "Skip" }, new ActionTypes { Code = "Complete" }, new ActionTypes { Code = "Override" },
            new ActionTypes { Code = "ForceRevert" }, new ActionTypes { Code = "Void" }, new ActionTypes { Code = "Cancel" }
        );
        db.TaskStatuses.AddRange(new TaskStatuses { Code = "Open" }, new TaskStatuses { Code = "Completed" });
        db.StageTypes.AddRange(
            new StageTypes { Code = "Approval" }, new StageTypes { Code = "Operational" },
            new StageTypes { Code = "Review" }, new StageTypes { Code = "Exception" }, new StageTypes { Code = "Closure" }
        );
        db.EntityTypes.AddRange(
            new Domain.Entities.EntityTypes { Code = "PurchaseRequisition" }, new Domain.Entities.EntityTypes { Code = "VendorRegistrationRequest" },
            new Domain.Entities.EntityTypes { Code = "RecurringPlan" }, new Domain.Entities.EntityTypes { Code = "ItemRequest" }
        );
        db.ApprovalRequestStatuses.AddRange(new ApprovalRequestStatuses { Code = "Approved" }, new ApprovalRequestStatuses { Code = "Rejected" }, new ApprovalRequestStatuses { Code = "PendingOpd" });
        db.AiCheckTypes.Add(new AiCheckTypes { Code = "DuplicateItemLocation" });
        await db.SaveChangesAsync();

        db.Departments.AddRange(
            new Departments { Id = ItDeptId, Code = "IT", Name = "IT", CreatedBy = SystemUserId },
            new Departments { Id = ProcDeptId, Code = "PROC", Name = "Procurement", CreatedBy = SystemUserId });
        db.Units.Add(new Domain.Entities.Units { Code = "EA", Name = "Each" });
        db.Categories.Add(new Categories { Code = "IT-EQUIP", Name = "IT Equipment", CreatedBy = SystemUserId });
        await db.SaveChangesAsync();
        var unitId = db.Units.Single().Id;
        var categoryId = db.Categories.Single().Id;
        db.Items.Add(new Items { Code = "ITM-1", Name = "Laptop", CategoryId = categoryId, UnitId = unitId, CreatedBy = SystemUserId });
        db.DepartmentCategories.Add(new DepartmentCategories { DepartmentId = ItDeptId, CategoryId = categoryId });
        await db.SaveChangesAsync();

        db.Users.AddRange(
            new Users { Id = SystemUserId, EmployeeNo = "SYS", DisplayName = "System", Email = "sys@t", DepartmentId = ItDeptId, CreatedBy = SystemUserId },
            new Users { Id = RequesterId, EmployeeNo = "E100", DisplayName = "Requester", Email = "req@t", DepartmentId = ItDeptId, CreatedBy = SystemUserId },
            new Users { Id = HodUserId, EmployeeNo = "E101", DisplayName = "Hod", Email = "hod@t", DepartmentId = ItDeptId, CreatedBy = SystemUserId },
            new Users { Id = FinanceUserId, EmployeeNo = "E102", DisplayName = "Finance", Email = "fin@t", DepartmentId = ItDeptId, CreatedBy = SystemUserId },
            new Users { Id = AuditUserId, EmployeeNo = "E103", DisplayName = "Audit", Email = "aud@t", DepartmentId = ItDeptId, CreatedBy = SystemUserId },
            new Users { Id = ProcurementUserId, EmployeeNo = "E104", DisplayName = "Procurement", Email = "proc@t", DepartmentId = ProcDeptId, CreatedBy = SystemUserId }
        );
        await db.SaveChangesAsync();

        await new RoleSeeder(db, new NullLogger<RoleSeeder>()).SeedAsync();
        var roles = await db.Roles.ToDictionaryAsync(r => r.Code, r => r.Id);
        db.UserRoleAssignments.AddRange(
            new UserRoleAssignments { UserId = RequesterId, RoleId = roles["REQUESTOR"], ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = SystemUserId },
            new UserRoleAssignments { UserId = HodUserId, RoleId = roles["HOD"], DepartmentId = ItDeptId, ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = SystemUserId },
            new UserRoleAssignments { UserId = FinanceUserId, RoleId = roles["FINANCE"], ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = SystemUserId },
            new UserRoleAssignments { UserId = AuditUserId, RoleId = roles["AUDIT"], ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = SystemUserId },
            new UserRoleAssignments { UserId = ProcurementUserId, RoleId = roles["PROCUREMENT"], ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = SystemUserId }
        );
        db.UserDepartmentAccess.Add(new UserDepartmentAccess { UserId = RequesterId, DepartmentId = ItDeptId, CreatedBy = SystemUserId });
        await db.SaveChangesAsync();

        var policySeeder = new PolicySeeder(db, new NullLogger<PolicySeeder>());
        await policySeeder.SeedAsync(SystemUserId);
        await new WorkflowSeeder(db, new NullLogger<WorkflowSeeder>()).SeedAsync(SystemUserId);
        await new SpendTaxonomySeeder(db, new NullLogger<SpendTaxonomySeeder>()).SeedAsync();

        return db;
    }

    private static (CreatePrHandler Create, SubmitPrHandler Submit, ActPrHandler Act, AcceptAndGroupHandler AcceptAndGroup) BuildHandlers(ProcurementDbContext db)
    {
        var lookups = new LookupCache(db);
        var access = new UserAccessService(db);
        var clock = new FixedClock();
        var bandResolver = new ApprovalBandResolver(db);
        var engine = new WorkflowEngine(db, bandResolver, lookups, clock);
        var permissions = new PermissionChecker(db, access, engine);
        var numbers = new FakeNumberGenerator();
        var priceGuidance = new PrPriceGuidanceService(db, new PolicySettingsReader(db));

        var create = new CreatePrHandler(db, access, lookups, numbers, priceGuidance);
        var submit = new SubmitPrHandler(db, engine, lookups, access);
        var act = new ActPrHandler(db, engine, permissions, access, lookups, numbers);
        var acceptAndGroup = new AcceptAndGroupHandler(db, permissions, lookups, new QuotationRuleResolver(db));
        return (create, submit, act, acceptAndGroup);
    }

    // PermissionChecker.RequireAsync needs seeded Permissions/RolePermissions to pass; this
    // test seeds only the three permissions it actually exercises, matching PermissionSeeder's
    // real role map exactly (see Infrastructure/Persistence/Seed/PermissionSeeder.cs).
    private static async Task SeedPermissionsAsync(ProcurementDbContext db)
    {
        var perms = new[] { "PR.CREATE", "PR.APPROVE", "SOURCING.GROUP" };
        foreach (var code in perms) db.Permissions.Add(new Domain.Entities.Permissions { Code = code, Description = code });
        await db.SaveChangesAsync();
        var roles = await db.Roles.ToDictionaryAsync(r => r.Code, r => r.Id);
        var permissionIds = await db.Permissions.ToDictionaryAsync(p => p.Code, p => p.Id);
        db.RolePermissions.AddRange(
            new RolePermissions { RoleId = roles["REQUESTOR"], PermissionId = permissionIds["PR.CREATE"] },
            new RolePermissions { RoleId = roles["HOD"], PermissionId = permissionIds["PR.APPROVE"] },
            new RolePermissions { RoleId = roles["FINANCE"], PermissionId = permissionIds["PR.APPROVE"] },
            new RolePermissions { RoleId = roles["AUDIT"], PermissionId = permissionIds["PR.APPROVE"] },
            new RolePermissions { RoleId = roles["PROCUREMENT"], PermissionId = permissionIds["SOURCING.GROUP"] }
        );
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task High_value_fault_pr_requires_HOD_then_Finance_then_Audit_before_reaching_Procurement()
    {
        var db = await BuildAsync();
        await SeedPermissionsAsync(db);
        var (create, submit, act, acceptAndGroup) = BuildHandlers(db);

        var itemId = db.Items.Single().Id;
        var prId = await create.Handle(new CreatePrCommand(
            RequesterId, ItDeptId, LocationId: 1, "APR-FAULT", null, "Final", false, null, "AC repair",
            new List<PrLineInput> { new(itemId, 1, db.Units.Single().Id, 10_000_000, null, null) }), default);

        var submitResult = await submit.Handle(new SubmitPrCommand(RequesterId, prId), default);
        submitResult.PrStatus.Should().Be("PendingHod", "a PR above 50 lac must still start with HOD, not skip ahead.");

        // Wrong role cannot act.
        var wrongRole = async () => await act.Handle(new ActPrCommand(FinanceUserId, prId, "FINANCE", WorkflowActionCode.Approve, null), default);
        await wrongRole.Should().ThrowAsync<UnauthorizedAccessException>();

        var afterHod = await act.Handle(new ActPrCommand(HodUserId, prId, "HOD", WorkflowActionCode.Approve, null), default);
        afterHod.PrStatus.Should().Be("PendingFinance");
        (await db.PurchaseRequisitions.FindAsync(prId))!.PrStatusId.Should()
            .Be((await db.PrStatuses.SingleAsync(s => s.Code == "PendingFinance")).Id, "status must stay Pending, never silently advance past Finance.");

        var afterFinance = await act.Handle(new ActPrCommand(FinanceUserId, prId, "FINANCE", WorkflowActionCode.Approve, null), default);
        afterFinance.PrStatus.Should().Be("PendingAudit", "above 50 lac still needs Audit after Finance.");

        var afterAudit = await act.Handle(new ActPrCommand(AuditUserId, prId, "AUDIT", WorkflowActionCode.Approve, null), default);
        afterAudit.PrStatus.Should().Be("PendingProcurement", "once every required approver has acted, the system moves it on automatically.");

        // And the system really did advance it - Procurement can now accept and group it.
        var groupIds = await acceptAndGroup.Handle(new AcceptAndGroupCommand(ProcurementUserId, prId), default);
        groupIds.Should().NotBeEmpty();
        (await db.PurchaseRequisitions.FindAsync(prId))!.PrStatusId.Should().Be((await db.PrStatuses.SingleAsync(s => s.Code == "PendingQuotations")).Id);
    }

    [Fact]
    public async Task Rejecting_at_any_stage_is_terminal_and_never_reaches_procurement()
    {
        var db = await BuildAsync();
        await SeedPermissionsAsync(db);
        var (create, submit, act, _) = BuildHandlers(db);

        var itemId = db.Items.Single().Id;
        var prId = await create.Handle(new CreatePrCommand(
            RequesterId, ItDeptId, 1, "APR-FAULT", null, "Final", false, null, "Not approved",
            new List<PrLineInput> { new(itemId, 1, db.Units.Single().Id, 2_000_000, null, null) }), default);
        await submit.Handle(new SubmitPrCommand(RequesterId, prId), default);

        await act.Handle(new ActPrCommand(HodUserId, prId, "HOD", WorkflowActionCode.Approve, null), default);
        var rejected = await act.Handle(new ActPrCommand(FinanceUserId, prId, "FINANCE", WorkflowActionCode.Reject, "Not justified."), default);

        rejected.PrStatus.Should().Be("Rejected");
        var again = async () => await act.Handle(new ActPrCommand(AuditUserId, prId, "AUDIT", WorkflowActionCode.Approve, null), default);
        await again.Should().ThrowAsync<InvalidOperationException>("a rejected PR's workflow instance is no longer Running.");
    }
}

internal sealed class NullLogger<T> : Microsoft.Extensions.Logging.ILogger<T>
{
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(Microsoft.Extensions.Logging.LogLevel logLevel) => false;
    public void Log<TState>(Microsoft.Extensions.Logging.LogLevel logLevel, Microsoft.Extensions.Logging.EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
}
