using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

// SpendHeads/SpendSubHeads from the workbook's Spend Taxonomy seed. Must run after
// ProcurementModes (a lookup) and WorkflowDefinitions are seeded.
public class SpendTaxonomySeeder
{
    private readonly ProcurementDbContext _db;
    private readonly ILogger<SpendTaxonomySeeder> _logger;

    public SpendTaxonomySeeder(ProcurementDbContext db, ILogger<SpendTaxonomySeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        if (await _db.SpendHeads.AnyAsync(ct)) return;

        var modes = await _db.ProcurementModes.ToDictionaryAsync(m => m.Code, m => m.Id, ct);
        var defs = await _db.WorkflowDefinitions.ToDictionaryAsync(d => d.Code, d => d.Id, ct);

        var preApproved = new SpendHeads { Code = "PRE", Name = "Pre-Approved", ApprovalMode = "PreApproved" };
        var onApproval = new SpendHeads { Code = "APR", Name = "On Approval", ApprovalMode = "OnApproval" };
        _db.SpendHeads.AddRange(preApproved, onApproval);
        await _db.SaveChangesAsync(ct);

        // PRE-CYC-FIXED is one spend sub-head shared by both the bill plan and the items plan
        // (the source taxonomy lists it once with "WF_CYCLIC_BILL / WF_CYCLIC_ITEMS"). A single
        // SpendSubHead can only default to one WorkflowDefinition, so this seeds the bill-plan
        // workflow here; RecurringOccurrenceGenerator overrides it to WF_CYCLIC_ITEMS at PR
        // creation time when the owning RecurringPlan.RecurringPlanTypeId is "Items".
        _db.SpendSubHeads.AddRange(
            new SpendSubHeads { SpendHeadId = preApproved.Id, Code = "PRE-CYC-FIXED", Name = "Cyclic Fixed", ProcurementModeId = modes["RecurringBill"], AllowsTentative = false, WorkflowDefinitionId = defs["WF_CYCLIC_BILL"] },
            new SpendSubHeads { SpendHeadId = preApproved.Id, Code = "PRE-CYC-USAGE", Name = "Cyclic On-Usage", ProcurementModeId = modes["Bill"], AllowsTentative = false, WorkflowDefinitionId = defs["WF_BILL"] },
            new SpendSubHeads { SpendHeadId = preApproved.Id, Code = "PRE-POL", Name = "As Policy", ProcurementModeId = modes["PolicyClaim"], AllowsTentative = false, WorkflowDefinitionId = defs["WF_BILL"] },
            new SpendSubHeads { SpendHeadId = onApproval.Id, Code = "APR-FAULT", Name = "Fault", ProcurementModeId = modes["Sourcing"], AllowsTentative = true, WorkflowDefinitionId = defs["WF_SOURCING"] },
            new SpendSubHeads { SpendHeadId = onApproval.Id, Code = "APR-PROJECT", Name = "Project", ProcurementModeId = modes["Sourcing"], AllowsTentative = true, WorkflowDefinitionId = defs["WF_SOURCING"] }
        );
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Seeded spend taxonomy (2 heads, 5 sub-heads).");
    }
}
