using Microsoft.EntityFrameworkCore;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

public static partial class DbSeeder
{
    private static async Task<Dictionary<string, WorkflowDefinitions>> SeedWorkflowAsync(
        ProcurementDbContext db, Dictionary<string, Roles> roles, Dictionary<string, Departments> departments, long systemUserId)
    {
        if (await db.WorkflowDefinitions.AnyAsync())
        {
            return await db.WorkflowDefinitions.ToDictionaryAsync(w => w.Code);
        }

        var stageTypes = await db.StageTypes.ToDictionaryAsync(s => s.Code);
        var prStatuses = await db.PrStatuses.ToDictionaryAsync(s => s.Code);
        var approvalStatuses = await db.ApprovalRequestStatuses.ToDictionaryAsync(s => s.Code);
        var prEntityType = await db.EntityTypes.FirstAsync(e => e.Code == EntityTypeCodes.PurchaseRequisition);
        var vendorRegEntityType = await db.EntityTypes.FirstAsync(e => e.Code == EntityTypeCodes.VendorRegistrationRequest);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var now = DateTime.UtcNow;

        WorkflowDefinitions NewDef(string code, string name, short entityTypeId) => new()
        {
            Code = code, Name = name, EntityTypeId = entityTypeId, Version = 1, IsActive = true,
            ActiveFrom = today, CreatedByUserId = systemUserId, CreatedAt = now,
        };

        WorkflowStages Stage(int seq, string stageCode, string typeCode, string? roleCode, string? prStatusCode,
            string? condition = null, bool optional = false, int? escalationDays = 3, string scopeType = WorkflowStageScopeTypes.None, long? scopeDeptId = null)
            => new()
            {
                StageCode = stageCode, Sequence = seq, StageTypeId = stageTypes[typeCode].Id,
                RoleId = roleCode == null ? null : roles[roleCode].Id,
                PrStatusId = prStatusCode == null ? null : prStatuses[prStatusCode].Id,
                ConditionExpr = condition, IsOptional = optional, EscalationDays = escalationDays,
                ScopeType = scopeType, ScopeDepartmentId = scopeDeptId,
                CreatedByUserId = systemUserId, CreatedAt = now,
            };

        var sourcing = NewDef(WorkflowDefinitionCodes.Sourcing, "Fault / Project Sourcing", prEntityType.Id);
        sourcing.Stages.Add(Stage(1, "HOD_APPROVAL", StageTypeCodes.Approval, RoleCodes.Hod, PrStatusCodes.PendingHod, scopeType: WorkflowStageScopeTypes.Department));
        sourcing.Stages.Add(Stage(2, "FINANCE_APPROVAL", StageTypeCodes.Approval, RoleCodes.Finance, PrStatusCodes.PendingFinance, condition: "Amount>1000000"));
        sourcing.Stages.Add(Stage(3, "AUDIT_APPROVAL", StageTypeCodes.Approval, RoleCodes.Audit, PrStatusCodes.PendingAudit, condition: "Amount>5000000"));
        sourcing.Stages.Add(Stage(4, "OPD_BUDGET_EXCEPTION", StageTypeCodes.Exception, RoleCodes.Opd, PrStatusCodes.PendingOpd, condition: "OverBudget>OVER_BUDGET_OPD_THRESHOLD", optional: true));
        sourcing.Stages.Add(Stage(5, "PROCUREMENT_ACCEPT", StageTypeCodes.Operational, RoleCodes.Procurement, PrStatusCodes.PendingProcurement));
        sourcing.Stages.Add(Stage(6, "QUOTATIONS", StageTypeCodes.Operational, RoleCodes.Procurement, PrStatusCodes.PendingQuotations));
        sourcing.Stages.Add(Stage(7, "QUOTE_REVIEW", StageTypeCodes.Review, RoleCodes.Audit, PrStatusCodes.PendingQuoteReview));
        sourcing.Stages.Add(Stage(8, "OPD_QUOTE_EXCEPTION", StageTypeCodes.Exception, RoleCodes.Opd, PrStatusCodes.PendingQuoteReview, condition: "IsHigherQuote&&Amount>OPD_QUOTE_EXCEPTION_THRESHOLD", optional: true));
        sourcing.Stages.Add(Stage(9, "PO_PREPARATION", StageTypeCodes.Operational, RoleCodes.Procurement, PrStatusCodes.PoPreparation));
        sourcing.Stages.Add(Stage(10, "PO_CONTRACT_ISSUE", StageTypeCodes.Operational, RoleCodes.Procurement, PrStatusCodes.PoIssued));
        sourcing.Stages.Add(Stage(11, "GOODS_RECEIPT", StageTypeCodes.Operational, RoleCodes.Procurement, PrStatusCodes.PartiallyReceived));
        sourcing.Stages.Add(Stage(12, "ACKNOWLEDGEMENT", StageTypeCodes.Operational, RoleCodes.Requestor, PrStatusCodes.AwaitingAcknowledgement, scopeType: WorkflowStageScopeTypes.Requester));
        sourcing.Stages.Add(Stage(13, "BILL_UPLOAD", StageTypeCodes.Operational, RoleCodes.Procurement, PrStatusCodes.BillPending));
        sourcing.Stages.Add(Stage(14, "FINANCE_PORTAL_SYNC", StageTypeCodes.Operational, RoleCodes.System, PrStatusCodes.WithFinancePortal));
        sourcing.Stages.Add(Stage(15, "AUDIT_VERIFY_STAMP", StageTypeCodes.Closure, RoleCodes.Audit, PrStatusCodes.AuditReview));
        sourcing.Stages.Add(Stage(16, "CLOSED", StageTypeCodes.Closure, null, PrStatusCodes.Closed, escalationDays: null));

        var bill = NewDef(WorkflowDefinitionCodes.Bill, "Bill / On-Usage / As Policy", prEntityType.Id);
        bill.Stages.Add(Stage(1, "HOD_APPROVAL", StageTypeCodes.Approval, RoleCodes.Hod, PrStatusCodes.PendingHod, scopeType: WorkflowStageScopeTypes.Department));
        bill.Stages.Add(Stage(2, "AUDIT_BILL_REVIEW", StageTypeCodes.Review, RoleCodes.Audit, PrStatusCodes.AuditReview));
        bill.Stages.Add(Stage(3, "FINANCE_APPROVAL", StageTypeCodes.Approval, RoleCodes.Finance, PrStatusCodes.PendingFinance));
        bill.Stages.Add(Stage(4, "FINANCE_PORTAL_SYNC", StageTypeCodes.Operational, RoleCodes.System, PrStatusCodes.WithFinancePortal));
        bill.Stages.Add(Stage(5, "AUDIT_VERIFY_STAMP", StageTypeCodes.Closure, RoleCodes.Audit, PrStatusCodes.AuditReview));
        bill.Stages.Add(Stage(6, "CLOSED", StageTypeCodes.Closure, null, PrStatusCodes.Closed, escalationDays: null));

        var cyclicBill = NewDef(WorkflowDefinitionCodes.CyclicBill, "Cyclic Fixed - Bill Plan", prEntityType.Id);
        cyclicBill.Stages.Add(Stage(1, "AWAITING_BILL", StageTypeCodes.Operational, RoleCodes.Requestor, PrStatusCodes.AwaitingBill, scopeType: WorkflowStageScopeTypes.Requester));
        cyclicBill.Stages.Add(Stage(2, "HOD_APPROVAL", StageTypeCodes.Approval, RoleCodes.Hod, PrStatusCodes.PendingHod, scopeType: WorkflowStageScopeTypes.Department));
        cyclicBill.Stages.Add(Stage(3, "AUDIT_BILL_REVIEW", StageTypeCodes.Review, RoleCodes.Audit, PrStatusCodes.AuditReview));
        cyclicBill.Stages.Add(Stage(4, "FINANCE_APPROVAL", StageTypeCodes.Approval, RoleCodes.Finance, PrStatusCodes.PendingFinance));
        cyclicBill.Stages.Add(Stage(5, "FINANCE_PORTAL_SYNC", StageTypeCodes.Operational, RoleCodes.System, PrStatusCodes.WithFinancePortal));
        cyclicBill.Stages.Add(Stage(6, "AUDIT_VERIFY_STAMP", StageTypeCodes.Closure, RoleCodes.Audit, PrStatusCodes.AuditReview));
        cyclicBill.Stages.Add(Stage(7, "CLOSED", StageTypeCodes.Closure, null, PrStatusCodes.Closed, escalationDays: null));

        var cyclicItems = NewDef(WorkflowDefinitionCodes.CyclicItems, "Cyclic Fixed - Items Plan", prEntityType.Id);
        cyclicItems.Stages.Add(Stage(1, "HOD_APPROVAL", StageTypeCodes.Approval, RoleCodes.Hod, PrStatusCodes.PendingHod, scopeType: WorkflowStageScopeTypes.Department));
        cyclicItems.Stages.Add(Stage(2, "PROCUREMENT_ACCEPT", StageTypeCodes.Operational, RoleCodes.Procurement, PrStatusCodes.PendingProcurement));
        cyclicItems.Stages.Add(Stage(3, "QUOTATIONS", StageTypeCodes.Operational, RoleCodes.Procurement, PrStatusCodes.PendingQuotations));
        cyclicItems.Stages.Add(Stage(4, "QUOTE_REVIEW", StageTypeCodes.Review, RoleCodes.Audit, PrStatusCodes.PendingQuoteReview));
        cyclicItems.Stages.Add(Stage(5, "PO_PREPARATION", StageTypeCodes.Operational, RoleCodes.Procurement, PrStatusCodes.PoPreparation));
        cyclicItems.Stages.Add(Stage(6, "GOODS_RECEIPT", StageTypeCodes.Operational, RoleCodes.Procurement, PrStatusCodes.PartiallyReceived));
        cyclicItems.Stages.Add(Stage(7, "ACKNOWLEDGEMENT", StageTypeCodes.Operational, RoleCodes.Requestor, PrStatusCodes.AwaitingAcknowledgement, scopeType: WorkflowStageScopeTypes.Requester));
        cyclicItems.Stages.Add(Stage(8, "BILL_UPLOAD", StageTypeCodes.Operational, RoleCodes.Procurement, PrStatusCodes.BillPending));
        cyclicItems.Stages.Add(Stage(9, "FINANCE_APPROVAL", StageTypeCodes.Approval, RoleCodes.Finance, PrStatusCodes.PendingFinance));
        cyclicItems.Stages.Add(Stage(10, "FINANCE_PORTAL_SYNC", StageTypeCodes.Operational, RoleCodes.System, PrStatusCodes.WithFinancePortal));
        cyclicItems.Stages.Add(Stage(11, "AUDIT_VERIFY_STAMP", StageTypeCodes.Closure, RoleCodes.Audit, PrStatusCodes.AuditReview));
        cyclicItems.Stages.Add(Stage(12, "CLOSED", StageTypeCodes.Closure, null, PrStatusCodes.Closed, escalationDays: null));

        var vendorReg = NewDef(WorkflowDefinitionCodes.VendorRegistration, "Vendor Registration", vendorRegEntityType.Id);
        vendorReg.Stages.Add(Stage(1, "PROCUREMENT_DECISION", StageTypeCodes.Approval, RoleCodes.Procurement, null));
        vendorReg.Stages.Add(Stage(2, "PROCUREMENT_HOD_DECISION", StageTypeCodes.Approval, RoleCodes.Hod, null, scopeType: WorkflowStageScopeTypes.FixedDepartment, scopeDeptId: departments["PROC"].Id));
        vendorReg.Stages.Add(Stage(3, "CLOSED", StageTypeCodes.Closure, null, null, escalationDays: null));

        db.WorkflowDefinitions.AddRange(sourcing, bill, cyclicBill, cyclicItems, vendorReg);
        await db.SaveChangesAsync();

        return await db.WorkflowDefinitions.ToDictionaryAsync(w => w.Code);
    }
}
