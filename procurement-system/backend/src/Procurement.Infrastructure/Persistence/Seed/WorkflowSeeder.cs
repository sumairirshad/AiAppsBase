using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

// Seeds the 7 WorkflowDefinitions and their WorkflowStages (WorkflowEngine runs purely off
// this configuration - see Procurement.Application/Workflow/WorkflowEngine.cs). Approval
// stages here are the DEFAULT band expansion for the "all three bands apply" case; the real
// per-PR stage list is expanded from ApprovalBands at submit time (IWorkflowEngine.Start),
// so a PR under 10 lac simply never gets a Finance/Audit task even though the stage rows
// exist in this table.
public class WorkflowSeeder
{
    private readonly ProcurementDbContext _db;
    private readonly ILogger<WorkflowSeeder> _logger;

    public WorkflowSeeder(ProcurementDbContext db, ILogger<WorkflowSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SeedAsync(long systemUserId, CancellationToken ct = default)
    {
        if (await _db.WorkflowDefinitions.AnyAsync(ct)) return;

        var entityTypes = await _db.EntityTypes.ToDictionaryAsync(e => e.Code, e => e.Id, ct);
        var roles = await _db.Roles.ToDictionaryAsync(r => r.Code, r => r.Id, ct);
        var stageTypes = await _db.StageTypes.ToDictionaryAsync(s => s.Code, s => s.Id, ct);
        var prStatuses = await _db.PrStatuses.ToDictionaryAsync(s => s.Code, s => s.Id, ct);
        var arStatuses = await _db.ApprovalRequestStatuses.ToDictionaryAsync(s => s.Code, s => s.Id, ct);
        var departments = await _db.Departments.ToDictionaryAsync(d => d.Code, d => d.Id, ct);
        long? procurementDeptId = departments.TryGetValue("PROC", out var pid) ? pid : null;

        short Approval = stageTypes["Approval"];
        short Operational = stageTypes["Operational"];
        short Review = stageTypes["Review"];
        short Exception = stageTypes["Exception"];
        short Closure = stageTypes["Closure"];

        var def = new WorkflowDefinitions[]
        {
            new() { Code = "WF_SOURCING", Name = "Fault / Project purchase (sourcing)", EntityTypeId = entityTypes["PurchaseRequisition"], Version = 1, ActiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = systemUserId },
            new() { Code = "WF_BILL", Name = "Bill / On-Usage / As-Policy", EntityTypeId = entityTypes["PurchaseRequisition"], Version = 1, ActiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = systemUserId },
            new() { Code = "WF_CYCLIC_BILL", Name = "Cyclic Fixed - bill plan", EntityTypeId = entityTypes["PurchaseRequisition"], Version = 1, ActiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = systemUserId },
            new() { Code = "WF_CYCLIC_ITEMS", Name = "Cyclic Fixed - items plan", EntityTypeId = entityTypes["PurchaseRequisition"], Version = 1, ActiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = systemUserId },
            new() { Code = "WF_VENDOR_REGISTRATION", Name = "Vendor registration", EntityTypeId = entityTypes["VendorRegistrationRequest"], Version = 1, ActiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = systemUserId },
            new() { Code = "WF_RECURRING_PLAN", Name = "Recurring plan approval", EntityTypeId = entityTypes["RecurringPlan"], Version = 1, ActiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = systemUserId },
            new() { Code = "WF_ITEM_REQUEST", Name = "New item / category request", EntityTypeId = entityTypes["ItemRequest"], Version = 1, ActiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), CreatedBy = systemUserId },
        };
        _db.WorkflowDefinitions.AddRange(def);
        await _db.SaveChangesAsync(ct);
        var byCode = def.ToDictionary(d => d.Code, d => d.Id);

        void AddStage(long defId, string code, int seq, short type, string? roleCode, string? prStatusCode,
            string? condition = null, bool optional = false, int? escalationDays = null, string? escalateToRole = null,
            string scope = "None", long? scopeDeptId = null)
        {
            _db.WorkflowStages.Add(new WorkflowStages
            {
                DefinitionId = defId,
                StageCode = code,
                Sequence = seq,
                StageTypeId = type,
                RoleId = roleCode is null ? null : roles[roleCode],
                PrStatusId = prStatusCode is null ? null : prStatuses.GetValueOrDefault(prStatusCode),
                ConditionExpr = condition,
                IsOptional = optional,
                EscalationDays = escalationDays,
                EscalateToRoleId = escalateToRole is null ? null : roles[escalateToRole],
                ScopeType = scope,
                ScopeDepartmentId = scopeDeptId,
                CreatedBy = systemUserId,
            });
        }

        // ---- WF_SOURCING: Fault / Project, the full purchase cycle ----
        var sourcingId = byCode["WF_SOURCING"];
        AddStage(sourcingId, "SUBMIT", 10, Operational, null, "PendingHod");
        AddStage(sourcingId, "APPROVE_HOD", 20, Approval, "HOD", "PendingHod", scope: "Department", escalationDays: 3, escalateToRole: "OPD");
        AddStage(sourcingId, "APPROVE_FINANCE", 30, Approval, "FINANCE", "PendingFinance", condition: "Amount>1000000", optional: true, escalationDays: 3, escalateToRole: "OPD");
        AddStage(sourcingId, "APPROVE_AUDIT", 40, Approval, "AUDIT", "PendingAudit", condition: "Amount>5000000", optional: true, escalationDays: 3, escalateToRole: "OPD");
        AddStage(sourcingId, "APPROVE_OPD_POLICY", 50, Approval, "OPD", "PendingOpd", condition: "OpdByPolicyOrReferral", optional: true, escalationDays: 3);
        AddStage(sourcingId, "PROCUREMENT_ACCEPT", 60, Operational, "PROCUREMENT", "PendingProcurement", escalationDays: 2, escalateToRole: "OPD");
        AddStage(sourcingId, "QUOTATIONS", 70, Operational, "PROCUREMENT", "PendingQuotations", escalationDays: 5, escalateToRole: "OPD");
        AddStage(sourcingId, "QUOTE_REVIEW", 80, Review, "AUDIT", "PendingQuoteReview", escalationDays: 3, escalateToRole: "OPD");
        AddStage(sourcingId, "APPROVE_OPD_HIGH_QUOTE", 90, Exception, "OPD", "PendingOpd", condition: "IsHigherQuote&&Amount>1000000", optional: true, escalationDays: 2);
        AddStage(sourcingId, "PO_CONTRACT", 100, Operational, "PROCUREMENT", "PoPreparation", escalationDays: 5, escalateToRole: "OPD");
        AddStage(sourcingId, "PO_ISSUED", 110, Operational, null, "PoIssued");
        AddStage(sourcingId, "GRN", 120, Operational, "PROCUREMENT", "PoIssued", escalationDays: 10, escalateToRole: "OPD");
        AddStage(sourcingId, "ACKNOWLEDGE", 130, Operational, "REQUESTOR", "AwaitingAcknowledgement", scope: "Requester", escalationDays: 5, escalateToRole: "OPD");
        AddStage(sourcingId, "BILL_FORWARD", 140, Operational, "PROCUREMENT", "BillPending", escalationDays: 5, escalateToRole: "OPD");
        AddStage(sourcingId, "FINANCE_PORTAL", 150, Operational, null, "WithFinancePortal");
        AddStage(sourcingId, "AUDIT_STAMP", 160, Closure, "AUDIT", "AuditReview", escalationDays: 5, escalateToRole: "OPD");

        // ---- WF_BILL: Bill / On-Usage / As-Policy ----
        var billId = byCode["WF_BILL"];
        AddStage(billId, "SUBMIT", 10, Operational, null, "PendingHod");
        AddStage(billId, "APPROVE_HOD", 20, Approval, "HOD", "PendingHod", scope: "Department", escalationDays: 3, escalateToRole: "OPD");
        AddStage(billId, "APPROVE_FINANCE", 30, Approval, "FINANCE", "PendingFinance", condition: "Amount>1000000", optional: true, escalationDays: 3, escalateToRole: "OPD");
        AddStage(billId, "APPROVE_AUDIT_BAND", 40, Approval, "AUDIT", "PendingAudit", condition: "Amount>5000000", optional: true, escalationDays: 3, escalateToRole: "OPD");
        AddStage(billId, "APPROVE_OPD_POLICY", 50, Approval, "OPD", "PendingOpd", condition: "OpdByPolicyOrReferral", optional: true, escalationDays: 3);
        AddStage(billId, "AUDIT_BILL_REVIEW", 60, Review, "AUDIT", "PendingAudit", escalationDays: 3, escalateToRole: "OPD");
        AddStage(billId, "APPROVE_FINANCE_FINAL", 70, Approval, "FINANCE", "PendingFinance", escalationDays: 3, escalateToRole: "OPD");
        AddStage(billId, "FINANCE_PORTAL", 80, Operational, null, "WithFinancePortal");
        AddStage(billId, "AUDIT_STAMP", 90, Closure, "AUDIT", "AuditReview", escalationDays: 5, escalateToRole: "OPD");

        // ---- WF_CYCLIC_BILL: Cyclic Fixed bill plan (system creates, owner uploads, then WF_BILL shape) ----
        var cyclicBillId = byCode["WF_CYCLIC_BILL"];
        AddStage(cyclicBillId, "GENERATE", 10, Operational, null, "AwaitingBill");
        AddStage(cyclicBillId, "OWNER_UPLOAD", 20, Operational, "REQUESTOR", "AwaitingBill", scope: "Requester", escalationDays: 5, escalateToRole: "OPD");
        AddStage(cyclicBillId, "APPROVE_HOD", 30, Approval, "HOD", "PendingHod", scope: "Department", escalationDays: 3, escalateToRole: "OPD");
        AddStage(cyclicBillId, "AUDIT_BILL_REVIEW", 40, Review, "AUDIT", "PendingAudit", escalationDays: 3, escalateToRole: "OPD");
        AddStage(cyclicBillId, "APPROVE_FINANCE", 50, Approval, "FINANCE", "PendingFinance", escalationDays: 3, escalateToRole: "OPD");
        AddStage(cyclicBillId, "FINANCE_PORTAL", 60, Operational, null, "WithFinancePortal");
        AddStage(cyclicBillId, "AUDIT_STAMP", 70, Closure, "AUDIT", "AuditReview", escalationDays: 5, escalateToRole: "OPD");

        // ---- WF_CYCLIC_ITEMS: Cyclic Fixed items plan (1 verification quote, recurring PO, no contract) ----
        var cyclicItemsId = byCode["WF_CYCLIC_ITEMS"];
        AddStage(cyclicItemsId, "GENERATE", 10, Operational, null, "Draft");
        AddStage(cyclicItemsId, "APPROVE_HOD", 20, Approval, "HOD", "PendingHod", scope: "Department", escalationDays: 3, escalateToRole: "OPD");
        AddStage(cyclicItemsId, "PROCUREMENT_VERIFY_QUOTE", 30, Operational, "PROCUREMENT", "PendingProcurement", escalationDays: 5, escalateToRole: "OPD");
        AddStage(cyclicItemsId, "AUDIT_REVIEW", 40, Review, "AUDIT", "PendingAudit", escalationDays: 3, escalateToRole: "OPD");
        AddStage(cyclicItemsId, "PO_ISSUED", 50, Operational, "PROCUREMENT", "PoIssued", escalationDays: 5, escalateToRole: "OPD");
        AddStage(cyclicItemsId, "GRN", 60, Operational, "PROCUREMENT", "PoIssued", escalationDays: 10, escalateToRole: "OPD");
        AddStage(cyclicItemsId, "ACKNOWLEDGE", 70, Operational, "REQUESTOR", "AwaitingAcknowledgement", scope: "Requester", escalationDays: 5, escalateToRole: "OPD");
        AddStage(cyclicItemsId, "BILL_FORWARD", 80, Operational, "PROCUREMENT", "BillPending", escalationDays: 5, escalateToRole: "OPD");
        AddStage(cyclicItemsId, "FINANCE_PORTAL", 90, Operational, null, "WithFinancePortal");
        AddStage(cyclicItemsId, "AUDIT_STAMP", 100, Closure, "AUDIT", "AuditReview", escalationDays: 5, escalateToRole: "OPD");

        // ---- WF_VENDOR_REGISTRATION ----
        var vendorId = byCode["WF_VENDOR_REGISTRATION"];
        AddStage(vendorId, "SUBMIT", 10, Operational, null, null);
        AddStage(vendorId, "PROCUREMENT_DECISION", 20, Approval, "PROCUREMENT", null);
        AddStage(vendorId, "PROCUREMENT_HOD_DECISION", 30, Approval, "HOD", null, scope: "FixedDepartment", scopeDeptId: procurementDeptId);
        AddStage(vendorId, "NOTIFY_REQUESTER", 40, Closure, null, null);

        // ---- WF_RECURRING_PLAN ----
        var recurringId = byCode["WF_RECURRING_PLAN"];
        AddStage(recurringId, "SUBMIT", 10, Operational, "OPD", null);
        AddStage(recurringId, "APPROVE_OPD", 20, Approval, "OPD", null);

        // ---- WF_ITEM_REQUEST ----
        var itemReqId = byCode["WF_ITEM_REQUEST"];
        AddStage(itemReqId, "SUBMIT", 10, Operational, null, null);
        AddStage(itemReqId, "APPROVE_OPD", 20, Approval, "OPD", null);

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Seeded {Count} workflow definitions.", def.Length);
    }
}
