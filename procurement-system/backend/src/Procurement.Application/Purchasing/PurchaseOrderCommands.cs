using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Purchasing;

// BR-034: one PO per awarded vendor, numbered from one base per PR (PO-2026-01077A, ...B).
// Every awarded line is allocated exactly once; creation is transactional (one SaveChanges)
// and idempotent via IdempotencyKey, so retrying the same request never creates duplicates.
public record CreatePurchaseOrdersCommand(long ActorUserId, long PrId, Guid IdempotencyKey, string AdvanceTypeCode, decimal? AdvancePct, decimal? AdvanceAmount, DateOnly DeliveryDate, string? PaymentTerms) : IRequest<List<long>>;

public class CreatePurchaseOrdersHandler : IRequestHandler<CreatePurchaseOrdersCommand, List<long>>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;
    private readonly IDocumentNumberGenerator _numbers;
    private readonly IWorkflowEngine _workflow;

    public CreatePurchaseOrdersHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups, IDocumentNumberGenerator numbers, IWorkflowEngine workflow)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
        _numbers = numbers;
        _workflow = workflow;
    }

    public async Task<List<long>> Handle(CreatePurchaseOrdersCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "PO.CREATE", ct);

        var existing = await _db.PurchaseOrders.Where(po => po.IdempotencyKey == request.IdempotencyKey).Select(po => po.Id).ToListAsync(ct);
        if (existing.Count > 0) return existing;

        var lines = await _db.PrLines.Where(l => l.PrId == request.PrId).ToListAsync(ct);
        var unallocated = lines.Where(l => l.AwardedVendorId is null).ToList();
        if (unallocated.Count > 0)
            throw new InvalidOperationException($"{unallocated.Count} line(s) have no awarded vendor yet - every line must be awarded before PO creation.");

        var pr = await _db.PurchaseRequisitions.FirstAsync(p => p.Id == request.PrId, ct);
        var baseNumber = (await _numbers.NextAsync(DocumentSequence.Po, ct)).Replace("PO-", "");
        // BR-038: recurring POs (Cyclic Fixed items plan) have no contract or security cheque
        // to wait for, so they go straight to Active instead of Issued-pending-contract.
        var isRecurring = pr.RecurringOccurrenceId.HasValue;
        var poTypeId = await _lookups.IdAsync<PoTypes, short>(isRecurring ? "Recurring" : "Standard", ct);
        var initialStatus = await _lookups.IdAsync<PoStatuses, short>(isRecurring ? "Active" : "Issued", ct);
        var advanceTypeId = await _lookups.IdAsync<AdvanceTypes, short>(request.AdvanceTypeCode, ct);

        var byVendor = lines.GroupBy(l => l.AwardedVendorId!.Value).OrderBy(g => g.Key).ToList();
        var poIds = new List<long>();
        var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        for (var i = 0; i < byVendor.Count; i++)
        {
            var vendorLines = byVendor[i];
            var suffix = byVendor.Count == 1 ? (char?)null : letters[i];
            var subTotal = vendorLines.Sum(l => l.AcceptedQty == 0 ? l.Qty * l.EstUnitPrice : l.AcceptedQty * l.EstUnitPrice);

            var po = new PurchaseOrders
            {
                PoNumber = $"PO-{baseNumber}{suffix}",
                PoBaseNumber = baseNumber,
                PoSuffix = suffix?.ToString(),
                PrId = pr.Id,
                VendorId = vendorLines.Key,
                PoTypeId = poTypeId,
                PoStatusId = initialStatus,
                CurrencyCode = "PKR",
                SubTotal = subTotal,
                Total = subTotal,
                DeliveryDate = request.DeliveryDate,
                PaymentTerms = request.PaymentTerms,
                IdempotencyKey = i == 0 ? request.IdempotencyKey : Guid.NewGuid(),
                IssuedAt = DateTime.UtcNow,
                AdvanceTypeId = advanceTypeId,
                AdvancePct = request.AdvancePct,
                AdvanceAmount = request.AdvanceAmount,
                CreatedBy = request.ActorUserId,
            };
            _db.PurchaseOrders.Add(po);
            await _db.SaveChangesAsync(ct);

            foreach (var line in vendorLines)
            {
                var qty = line.Qty;
                _db.Set<PoLines>().Add(new PoLines
                {
                    PoId = po.Id,
                    PrLineId = line.Id,
                    QuotationLineId = line.AwardedQuotationLineId,
                    Qty = qty,
                    UnitPrice = line.EstUnitPrice,
                });
            }
            await _db.SaveChangesAsync(ct);
            poIds.Add(po.Id);
        }

        // Recurring POs need no contract/cheque activation step (BR-038 exemption), so this
        // completes the PO_ISSUED task itself and advances straight to GRN; the normal
        // purchase cycle instead waits for ActivateContractCommand to do that.
        if (isRecurring && pr.WorkflowInstanceId.HasValue)
        {
            var definitionId = await _db.WorkflowInstances.Where(i => i.Id == pr.WorkflowInstanceId.Value).Select(i => i.DefinitionId).FirstAsync(ct);
            var procurementRoleId = await _lookups.IdAsync<Roles, long>("PROCUREMENT", ct);
            var result = await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
                pr.WorkflowInstanceId.Value, request.ActorUserId, procurementRoleId, WorkflowActionCode.Complete,
                pr.RequesterId, pr.DepartmentId, CurrentAmount: pr.EstimatedAmount), ct);

            pr.PrStatusId = result.CurrentStageCode is null
                ? await _lookups.IdAsync<PrStatuses, short>("Closed", ct)
                : (await _db.WorkflowStages.FirstOrDefaultAsync(s => s.DefinitionId == definitionId && s.StageCode == result.CurrentStageCode, ct))?.PrStatusId
                  ?? pr.PrStatusId;
            pr.UpdatedBy = request.ActorUserId;
            pr.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }

        return poIds;
    }
}

public record GenerateContractCommand(long ActorUserId, long PoId, long TemplateId, DateOnly? StartDate, DateOnly? EndDate, string? CountryOfOrigin, string? Incoterms) : IRequest<long>;

public class GenerateContractHandler : IRequestHandler<GenerateContractCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public GenerateContractHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task<long> Handle(GenerateContractCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "CONTRACT.MANAGE", ct);
        var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == request.PoId, ct)
            ?? throw new InvalidOperationException("PO not found.");
        var template = await _db.Set<ContractTemplates>().FirstOrDefaultAsync(t => t.Id == request.TemplateId, ct)
            ?? throw new InvalidOperationException("Contract template not found.");
        var clauses = await _db.Set<ContractClauses>().Where(c => c.TemplateId == template.Id).OrderBy(c => c.Sequence).ToListAsync(ct);

        var terms = string.Join("\n\n", clauses.Select(c => $"{c.Title}\n{c.Body}"
            .Replace("{Qty}", po.SubTotal.ToString())
            .Replace("{Origin}", request.CountryOfOrigin ?? "Pakistan")));

        var contract = new Contracts
        {
            PoId = po.Id,
            ContractTypeId = template.ContractTypeId,
            Terms = terms,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TemplateId = template.Id,
            CountryOfOrigin = request.CountryOfOrigin,
            Incoterms = request.Incoterms,
            CreatedBy = request.ActorUserId,
        };
        _db.Set<Contracts>().Add(contract);
        await _db.SaveChangesAsync(ct);
        return contract.Id;
    }
}

// BR-038: the PO becomes Active only after the signed contract AND the security cheque are
// uploaded - recurring POs are exempt (no contract at all for those, handled separately).
public record ActivateContractCommand(long ActorUserId, long PoId, long SignedDocumentId, string ChequeNo, string ChequeBank, decimal ChequeAmount, long ChequeDocumentId) : IRequest<SubmitPrResult?>;

public class ActivateContractHandler : IRequestHandler<ActivateContractCommand, SubmitPrResult?>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;
    private readonly IWorkflowEngine _workflow;

    public ActivateContractHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups, IWorkflowEngine workflow)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
        _workflow = workflow;
    }

    public async Task<SubmitPrResult?> Handle(ActivateContractCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "CONTRACT.MANAGE", ct);
        var contract = await _db.Set<Contracts>().FirstOrDefaultAsync(c => c.PoId == request.PoId, ct)
            ?? throw new InvalidOperationException("No contract has been generated for this PO yet.");

        contract.SignedDocumentId = request.SignedDocumentId;
        contract.ChequeNo = request.ChequeNo;
        contract.ChequeBank = request.ChequeBank;
        contract.ChequeAmount = request.ChequeAmount;
        contract.ChequeDocumentId = request.ChequeDocumentId;
        contract.ChequeStatusId = await _lookups.IdAsync<SecurityDepositStatuses, short>("Held", ct);
        contract.UpdatedBy = request.ActorUserId;
        contract.UpdatedAt = DateTime.UtcNow;

        var po = await _db.PurchaseOrders.FirstAsync(p => p.Id == request.PoId, ct);
        po.PoStatusId = await _lookups.IdAsync<PoStatuses, short>("Active", ct);
        po.UpdatedBy = request.ActorUserId;
        po.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        // BR-038: only once every PO on the PR is Active does the PR move past PO
        // preparation into receiving - a single vendor's missing contract/cheque holds the
        // whole PR, never a silent partial progress.
        var activeStatus = await _lookups.IdAsync<PoStatuses, short>("Active", ct);
        var allPos = await _db.PurchaseOrders.Where(p => p.PrId == po.PrId).ToListAsync(ct);
        if (allPos.Any(p => p.PoStatusId != activeStatus)) return null;

        var pr = await _db.PurchaseRequisitions.FirstAsync(p => p.Id == po.PrId, ct);
        if (pr.WorkflowInstanceId is null) return null;
        var definitionId = await _db.WorkflowInstances.Where(i => i.Id == pr.WorkflowInstanceId.Value).Select(i => i.DefinitionId).FirstAsync(ct);
        var procurementRoleId = await _lookups.IdAsync<Roles, long>("PROCUREMENT", ct);

        var result = await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
            pr.WorkflowInstanceId.Value, request.ActorUserId, procurementRoleId, WorkflowActionCode.Complete,
            pr.RequesterId, pr.DepartmentId, CurrentAmount: pr.EstimatedAmount), ct);

        var statusId = result.CurrentStageCode is null
            ? await _lookups.IdAsync<PrStatuses, short>("Closed", ct)
            : (await _db.WorkflowStages.FirstOrDefaultAsync(s => s.DefinitionId == definitionId && s.StageCode == result.CurrentStageCode, ct))?.PrStatusId
              ?? await _lookups.IdAsync<PrStatuses, short>("PoIssued", ct);
        pr.PrStatusId = statusId;
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new SubmitPrResult((await _db.PrStatuses.FindAsync(new object[] { statusId }, ct))!.Code, result.NextRole);
    }
}

// BR-036: any change to PO terms after issue is recorded as an amendment; increases are
// escalations (and notify stakeholders - see Alerts module in task 9).
public record AmendPurchaseOrderCommand(long ActorUserId, long PoId, string AmendmentTypeCode, string OldValue, string NewValue, bool IsEscalation, string Reason) : IRequest<long>;

public class AmendPurchaseOrderHandler : IRequestHandler<AmendPurchaseOrderCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;
    private readonly Alerts.NotificationService _notifications;

    public AmendPurchaseOrderHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups, Alerts.NotificationService notifications)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
        _notifications = notifications;
    }

    public async Task<long> Handle(AmendPurchaseOrderCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "PO.AMEND", ct);
        if (string.IsNullOrWhiteSpace(request.Reason)) throw new InvalidOperationException("A reason is required for a PO amendment.");

        var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == request.PoId, ct)
            ?? throw new InvalidOperationException("PO not found.");
        var amendmentNo = await _db.Set<PoAmendments>().Where(a => a.PoId == po.Id).CountAsync(ct) + 1;

        var amendment = new PoAmendments
        {
            PoId = po.Id,
            AmendmentNo = amendmentNo,
            AmendmentTypeId = await _lookups.IdAsync<AmendmentTypes, short>(request.AmendmentTypeCode, ct),
            OldValue = request.OldValue,
            NewValue = request.NewValue,
            IsEscalation = request.IsEscalation,
            Reason = request.Reason,
            ApprovedBy = request.ActorUserId,
            CreatedBy = request.ActorUserId,
        };
        _db.Set<PoAmendments>().Add(amendment);
        await _db.SaveChangesAsync(ct);

        // BR-036: an increase is an escalation and notifies the Requestor, HOD, Finance and Audit.
        if (request.IsEscalation)
        {
            var pr = await _db.PurchaseRequisitions.FirstAsync(p => p.Id == po.PrId, ct);
            var message = $"PO {po.PoNumber} terms changed ({request.AmendmentTypeCode}: {request.OldValue} -> {request.NewValue}). Reason: {request.Reason}";
            await _notifications.NotifyUserAsync(pr.RequesterId, "PurchaseOrder", po.Id, message, "PoTermsChanged", $"PoAmend:{amendment.Id}:requester", ct);
            await _notifications.NotifyRoleAsync("HOD", pr.DepartmentId, "PurchaseOrder", po.Id, message, "PoTermsChanged", $"PoAmend:{amendment.Id}:hod", ct);
            await _notifications.NotifyRoleAsync("FINANCE", null, "PurchaseOrder", po.Id, message, "PoTermsChanged", $"PoAmend:{amendment.Id}:finance", ct);
            await _notifications.NotifyRoleAsync("AUDIT", null, "PurchaseOrder", po.Id, message, "PoTermsChanged", $"PoAmend:{amendment.Id}:audit", ct);
        }
        return amendment.Id;
    }
}
