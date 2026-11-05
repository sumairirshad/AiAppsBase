using Microsoft.EntityFrameworkCore;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

public static partial class DbSeeder
{
    private static async Task<Dictionary<string, SpendSubHeads>> SeedCatalogAsync(
        ProcurementDbContext db, Dictionary<string, Departments> departments, Dictionary<string, WorkflowDefinitions> workflows, long systemUserId)
    {
        if (!await db.SpendHeads.AnyAsync())
        {
            db.SpendHeads.Add(new SpendHeads { Code = "PRE", Name = "Pre-Approved", ApprovalMode = "PreApproved" });
            db.SpendHeads.Add(new SpendHeads { Code = "APR", Name = "On Approval", ApprovalMode = "OnApproval" });
            await db.SaveChangesAsync();
        }
        var spendHeads = await db.SpendHeads.ToDictionaryAsync(s => s.Code);

        if (!await db.ProcurementModes.AnyAsync()) { /* seeded in lookups phase */ }
        var modes = await db.ProcurementModes.ToDictionaryAsync(m => m.Code);

        if (!await db.SpendSubHeads.AnyAsync())
        {
            db.SpendSubHeads.AddRange(
                new SpendSubHeads { SpendHeadId = spendHeads["PRE"].Id, Code = SpendSubHeadCodes.PreCycFixed, Name = "Cyclic Fixed", ProcurementModeId = modes[ProcurementModeCodes.RecurringBill].Id, AllowsTentative = false, WorkflowDefinitionId = workflows[WorkflowDefinitionCodes.CyclicBill].Id },
                new SpendSubHeads { SpendHeadId = spendHeads["PRE"].Id, Code = SpendSubHeadCodes.PreCycUsage, Name = "Cyclic On-Usage", ProcurementModeId = modes[ProcurementModeCodes.Bill].Id, AllowsTentative = false, WorkflowDefinitionId = workflows[WorkflowDefinitionCodes.Bill].Id },
                new SpendSubHeads { SpendHeadId = spendHeads["PRE"].Id, Code = SpendSubHeadCodes.PrePolicy, Name = "As Policy", ProcurementModeId = modes[ProcurementModeCodes.PolicyClaim].Id, AllowsTentative = false, WorkflowDefinitionId = workflows[WorkflowDefinitionCodes.Bill].Id },
                new SpendSubHeads { SpendHeadId = spendHeads["APR"].Id, Code = SpendSubHeadCodes.AprFault, Name = "Fault", ProcurementModeId = modes[ProcurementModeCodes.Sourcing].Id, AllowsTentative = true, WorkflowDefinitionId = workflows[WorkflowDefinitionCodes.Sourcing].Id },
                new SpendSubHeads { SpendHeadId = spendHeads["APR"].Id, Code = SpendSubHeadCodes.AprProject, Name = "Project", ProcurementModeId = modes[ProcurementModeCodes.Sourcing].Id, AllowsTentative = true, WorkflowDefinitionId = workflows[WorkflowDefinitionCodes.Sourcing].Id });
            await db.SaveChangesAsync();
        }
        var subHeads = await db.SpendSubHeads.ToDictionaryAsync(s => s.Code);

        if (!await db.Units.AnyAsync())
        {
            db.Units.AddRange(
                new Units { Code = "EA", Name = "Each", Precision = 0 },
                new Units { Code = "KG", Name = "Kilogram", Precision = 2 },
                new Units { Code = "LTR", Name = "Litre", Precision = 2 },
                new Units { Code = "MTR", Name = "Metre", Precision = 2 },
                new Units { Code = "SET", Name = "Set", Precision = 0 },
                new Units { Code = "HR", Name = "Hour", Precision = 1 },
                new Units { Code = "MONTH", Name = "Month", Precision = 0 });
            await db.SaveChangesAsync();
        }

        if (!await db.Categories.AnyAsync())
        {
            var now = DateTime.UtcNow;
            db.Categories.AddRange(
                new Categories { Code = "IT-HW", Name = "IT Hardware", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Categories { Code = "IT-SW", Name = "IT Software & Licenses", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Categories { Code = "OFF-SUP", Name = "Office Supplies", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Categories { Code = "FAC-MNT", Name = "Facility Maintenance", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Categories { Code = "UTILITIES", Name = "Utilities", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Categories { Code = "TRAVEL", Name = "Travel & Transport", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Categories { Code = "PROJ-MAT", Name = "Project Materials", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Categories { Code = "HR-SVC", Name = "HR Services", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now });
            await db.SaveChangesAsync();
        }
        var categories = await db.Categories.ToDictionaryAsync(c => c.Code);

        if (!await db.Items.AnyAsync())
        {
            var now = DateTime.UtcNow;
            var ea = (await db.Units.FirstAsync(u => u.Code == "EA")).Id;
            var set = (await db.Units.FirstAsync(u => u.Code == "SET")).Id;
            var month = (await db.Units.FirstAsync(u => u.Code == "MONTH")).Id;
            db.Items.AddRange(
                new Items { Code = "ITM-LAPTOP", Name = "Business Laptop", CategoryId = categories["IT-HW"].Id, UnitId = ea, IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Items { Code = "ITM-MONITOR", Name = "24-inch Monitor", CategoryId = categories["IT-HW"].Id, UnitId = ea, IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Items { Code = "ITM-AC-REPAIR", Name = "AC Repair Service", CategoryId = categories["FAC-MNT"].Id, UnitId = ea, IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Items { Code = "ITM-GENERATOR-SVC", Name = "Generator Service", CategoryId = categories["FAC-MNT"].Id, UnitId = ea, IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Items { Code = "ITM-STATIONERY-SET", Name = "Monthly Stationery Basket", CategoryId = categories["OFF-SUP"].Id, UnitId = set, IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Items { Code = "ITM-ELECTRICITY", Name = "Electricity Bill", CategoryId = categories["UTILITIES"].Id, UnitId = month, IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Items { Code = "ITM-ISP", Name = "Internet Service", CategoryId = categories["UTILITIES"].Id, UnitId = month, IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now },
                new Items { Code = "ITM-SOLAR-PANEL", Name = "Solar Panel Installation", CategoryId = categories["PROJ-MAT"].Id, UnitId = ea, IsActive = true, CreatedByUserId = systemUserId, CreatedAt = now });
            await db.SaveChangesAsync();
        }

        if (!await db.DepartmentCategories.AnyAsync())
        {
            void Map(string dept, params string[] cats)
            {
                foreach (var cat in cats)
                {
                    db.DepartmentCategories.Add(new DepartmentCategories { DepartmentId = departments[dept].Id, CategoryId = categories[cat].Id });
                }
            }
            Map("IT", "IT-HW", "IT-SW", "OFF-SUP");
            Map("HR", "OFF-SUP", "HR-SVC", "TRAVEL");
            Map("PROC", "IT-HW", "IT-SW", "OFF-SUP", "FAC-MNT", "UTILITIES", "TRAVEL", "PROJ-MAT", "HR-SVC");
            Map("FIN", "OFF-SUP");
            Map("AUD", "OFF-SUP");
            Map("OPD", "IT-HW", "IT-SW", "OFF-SUP", "FAC-MNT", "UTILITIES", "TRAVEL", "PROJ-MAT", "HR-SVC");
            await db.SaveChangesAsync();
        }

        return subHeads;
    }
}
