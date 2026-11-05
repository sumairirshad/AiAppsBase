using Microsoft.EntityFrameworkCore;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

public static partial class DbSeeder
{
    public static async Task SeedAsync(ProcurementDbContext db)
    {
        var systemUserId = await SeedSystemUserAsync(db);

        await SeedLookupsAsync(db);
        var roles = await SeedRolesAndPermissionsAsync(db);
        var departments = await SeedDepartmentsAndLocationsAsync(db, systemUserId);
        await SeedUsersAsync(db, roles, departments, systemUserId);
        var workflows = await SeedWorkflowAsync(db, roles, departments, systemUserId);
        var subHeads = await SeedCatalogAsync(db, departments, workflows, systemUserId);
        await SeedPolicyAsync(db, roles, subHeads, systemUserId);
        await SeedContractTemplatesAsync(db, systemUserId);
    }

    private static async Task<long> SeedSystemUserAsync(ProcurementDbContext db)
    {
        var existing = await db.Users.FirstOrDefaultAsync(u => u.EmployeeNo == "SYSTEM");
        if (existing != null) return existing.Id;

        if (!await db.Departments.AnyAsync(d => d.Code == "SYS"))
        {
            db.Departments.Add(new Departments { Code = "SYS", Name = "System", IsActive = true, CreatedByUserId = 0, CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
        }
        var sysDept = await db.Departments.FirstAsync(d => d.Code == "SYS");

        var systemUser = new Users
        {
            EmployeeNo = "SYSTEM",
            DisplayName = "System",
            Email = "system@procurement.local",
            DepartmentId = sysDept.Id,
            PasswordHash = null,
            IsActive = true,
            CreatedByUserId = 0,
            CreatedAt = DateTime.UtcNow,
        };
        db.Users.Add(systemUser);
        await db.SaveChangesAsync();

        systemUser.CreatedByUserId = systemUser.Id;
        sysDept.CreatedByUserId = systemUser.Id;
        await db.SaveChangesAsync();

        return systemUser.Id;
    }

    private static async Task SeedContractTemplatesAsync(ProcurementDbContext db, long systemUserId)
    {
        if (await db.ContractTemplates.AnyAsync()) return;

        var supplyType = await db.ContractTypes.FirstAsync(c => c.Code == ContractTypeCodes.Supply);
        var clauseCategories = await db.ClauseCategories.ToDictionaryAsync(c => c.Code);
        var now = DateTime.UtcNow;

        var template = new ContractTemplates
        {
            Code = "STD-SUPPLY-V1",
            Name = "Standard Supply Contract",
            ContractTypeId = supplyType.Id,
            Version = 1,
            IsActive = true,
            CreatedByUserId = systemUserId,
            CreatedAt = now,
        };

        void AddClause(int seq, string category, string title, string body, bool mandatory = true)
        {
            template.Clauses.Add(new ContractClauses
            {
                ClauseCategoryId = clauseCategories[category].Id,
                Sequence = seq,
                Title = title,
                Body = body,
                IsMandatory = mandatory,
                CreatedByUserId = systemUserId,
                CreatedAt = now,
            });
        }

        AddClause(1, "Scope", "Scope of Supply", "The Vendor shall supply {Item} in the quantity of {Qty} as specified in Purchase Order {PoNumber}.");
        AddClause(2, "Delivery", "Delivery", "Delivery shall be made to the location specified in the Purchase Order by {DeliveryDate}.");
        AddClause(3, "Import & Customs", "Import & Customs", "Where the supply originates outside Pakistan, the Incoterm {Incoterms} and country of origin {Origin} shall apply.", mandatory: false);
        AddClause(4, "Payment", "Payment Terms", "Payment shall be made in accordance with the terms set out in the Purchase Order.");
        AddClause(5, "Advance", "Advance Payment", "Where an advance is specified on the Purchase Order, it shall be released through the Finance Portal and adjusted against subsequent bills.", mandatory: false);
        AddClause(6, "Warranty", "Warranty", "The Vendor warrants that the goods supplied are free from defects for a period as agreed in the Purchase Order.");
        AddClause(7, "Penalty", "Penalty for Delay", "Delayed delivery shall attract a penalty as specified in the Purchase Order, subject to the agreed cap.", mandatory: false);
        AddClause(8, "Security Deposit", "Security Deposit", "The Vendor shall furnish a security cheque as specified before this contract becomes active.");
        AddClause(9, "Governing Law", "Governing Law", "This contract shall be governed by the Laws of Pakistan.");
        AddClause(10, "Dispute Resolution", "Dispute Resolution", "Any dispute arising from this contract shall first be referred to good-faith negotiation, failing which it shall be resolved under the Laws of Pakistan.");
        AddClause(11, "Termination", "Termination", "Either party may terminate this contract for material breach upon written notice.");
        AddClause(12, "Confidentiality", "Confidentiality", "Both parties shall keep confidential any proprietary information exchanged under this contract.");

        db.ContractTemplates.Add(template);
        await db.SaveChangesAsync();
    }
}
