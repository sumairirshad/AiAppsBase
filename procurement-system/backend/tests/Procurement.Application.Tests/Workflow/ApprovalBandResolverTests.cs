using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Application.Tests.Workflow;

// BR-015 boundary cases (TC-026..029): up to 10 lac HOD only; just above it also needs
// Finance; just above 50 lac also needs Audit.
public class ApprovalBandResolverTests
{
    private async Task<(ProcurementDbContext Db, ApprovalBandResolver Resolver, long PolicyVersionId)> BuildAsync()
    {
        var options = new DbContextOptionsBuilder<ProcurementDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var db = new ProcurementDbContext(options);
        db.Roles.AddRange(new Roles { Code = "HOD", Name = "HOD" }, new Roles { Code = "FINANCE", Name = "Finance" }, new Roles { Code = "AUDIT", Name = "Audit" });
        await db.SaveChangesAsync();
        var hod = db.Roles.Single(r => r.Code == "HOD").Id;
        var finance = db.Roles.Single(r => r.Code == "FINANCE").Id;
        var audit = db.Roles.Single(r => r.Code == "AUDIT").Id;

        db.Users.Add(new Users { Id = 1, EmployeeNo = "E1", DisplayName = "x", Email = "x@x", DepartmentId = 1, CreatedBy = 1 });
        db.PolicyVersions.Add(new PolicyVersions { VersionNo = 1, EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), StatusId = 1, ChangeReason = "t", CreatedBy = 1 });
        await db.SaveChangesAsync();
        var policyVersionId = db.PolicyVersions.Single().Id;

        db.ApprovalBands.AddRange(
            new ApprovalBands { PolicyVersionId = policyVersionId, MinAmount = 0, MaxAmount = 1_000_000, Sequence = 1, RoleId = hod, CreatedBy = 1 },
            new ApprovalBands { PolicyVersionId = policyVersionId, MinAmount = 1_000_000.01m, MaxAmount = 5_000_000, Sequence = 1, RoleId = hod, CreatedBy = 1 },
            new ApprovalBands { PolicyVersionId = policyVersionId, MinAmount = 1_000_000.01m, MaxAmount = 5_000_000, Sequence = 2, RoleId = finance, CreatedBy = 1 },
            new ApprovalBands { PolicyVersionId = policyVersionId, MinAmount = 5_000_000.01m, MaxAmount = null, Sequence = 1, RoleId = hod, CreatedBy = 1 },
            new ApprovalBands { PolicyVersionId = policyVersionId, MinAmount = 5_000_000.01m, MaxAmount = null, Sequence = 2, RoleId = finance, CreatedBy = 1 },
            new ApprovalBands { PolicyVersionId = policyVersionId, MinAmount = 5_000_000.01m, MaxAmount = null, Sequence = 3, RoleId = audit, CreatedBy = 1 }
        );
        await db.SaveChangesAsync();
        return (db, new ApprovalBandResolver(db), policyVersionId);
    }

    [Fact]
    public async Task Exactly_one_million_needs_only_HOD()
    {
        var (_, resolver, policyVersionId) = await BuildAsync();
        var steps = await resolver.ResolveAsync(policyVersionId, 1_000_000, null);
        steps.Select(s => s.RoleCode).Should().BeEquivalentTo(new[] { "HOD" });
    }

    [Fact]
    public async Task Just_above_one_million_also_needs_Finance()
    {
        var (_, resolver, policyVersionId) = await BuildAsync();
        var steps = await resolver.ResolveAsync(policyVersionId, 1_000_000.01m, null);
        steps.Select(s => s.RoleCode).Should().BeEquivalentTo(new[] { "HOD", "FINANCE" });
    }

    [Fact]
    public async Task Exactly_five_million_does_not_need_Audit()
    {
        var (_, resolver, policyVersionId) = await BuildAsync();
        var steps = await resolver.ResolveAsync(policyVersionId, 5_000_000, null);
        steps.Select(s => s.RoleCode).Should().BeEquivalentTo(new[] { "HOD", "FINANCE" });
    }

    [Fact]
    public async Task Just_above_five_million_also_needs_Audit()
    {
        var (_, resolver, policyVersionId) = await BuildAsync();
        var steps = await resolver.ResolveAsync(policyVersionId, 5_000_000.01m, null);
        steps.Select(s => s.RoleCode).Should().BeEquivalentTo(new[] { "HOD", "FINANCE", "AUDIT" });
    }
}
