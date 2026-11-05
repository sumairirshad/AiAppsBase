using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Common.Numbering;
using Procurement.Application.Features.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Purchasing;

public record CreatePurchaseOrdersCommand(long PrId, List<CreatePoInput> PurchaseOrders, Guid? IdempotencyKey) : IRequest<List<long>>;

/// <summary>Creates one PO per awarded vendor for a PR. Every PR line with an AwardedVendorId must be allocated
/// to exactly one PO line; a PR with more than one awarded vendor gets a shared base number with a letter suffix
/// per vendor (PO-2026-00001A, PO-2026-00001B, ...).</summary>
public class CreatePurchaseOrdersCommandHandler : IRequestHandler<CreatePurchaseOrdersCommand, List<long>>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public CreatePurchaseOrdersCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task<List<long>> Handle(CreatePurchaseOrdersCommand request, CancellationToken ct)
    {
        if (!await _currentUser.HasRoleAsync(RoleCodes.Procurement))
        {
            throw new ForbiddenAccessException("Only Procurement may create purchase orders.");
        }

        if (request.IdempotencyKey != null)
        {
            var existing = await _db.PurchaseOrders.Where(p => p.IdempotencyKey == request.IdempotencyKey).Select(p => p.Id).ToListAsync(ct);
            if (existing.Count > 0) return existing;
        }

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);

        var awardedLines = await _db.PrLines.Where(l => l.PrId == pr.Id && l.AwardedVendorId != null).ToListAsync(ct);
        var allocatedLineIds = request.PurchaseOrders.SelectMany(po => po.Lines.Select(l => l.PrLineId)).ToList();
        var unallocated = awardedLines.Where(l => !allocatedLineIds.Contains(l.Id)).ToList();
        if (unallocated.Count > 0)
        {
            throw new BusinessRuleException("Every awarded line must be allocated to a purchase order before creating POs.");
        }

        var poType = await _db.PoTypes.FirstAsync(t => t.Code == PoTypeCodes.Standard, ct);
        var draftStatus = await _db.PoStatuses.FirstAsync(s => s.Code == PoStatusCodes.Issued, ct);
        var idempotencyKey = request.IdempotencyKey ?? Guid.NewGuid();
        var baseNumber = await DocumentNumberGenerator.NextAsync(_db, "seq_po", "PO", 5, ct);
        var now = DateTime.UtcNow;
        var createdIds = new List<long>();
        var multiVendor = request.PurchaseOrders.Count > 1;
        var suffixIndex = 0;

        foreach (var input in request.PurchaseOrders)
        {
            var advanceType = await _db.AdvanceTypes.FirstAsync(t => t.Code == input.AdvanceTypeCode, ct);
            var subTotal = input.Lines.Sum(l => l.Qty * l.UnitPrice);
            char? suffix = multiVendor ? (char)('A' + suffixIndex++) : null;

            var po = new PurchaseOrders
            {
                PoNumber = suffix == null ? baseNumber : $"{baseNumber}{suffix}",
                PrId = pr.Id,
                VendorId = input.VendorId,
                PoTypeId = poType.Id,
                PoStatusId = draftStatus.Id,
                CurrencyCode = "PKR",
                SubTotal = subTotal,
                TaxTotal = 0,
                Total = subTotal,
                RetentionPct = input.RetentionPct,
                DeliveryDate = input.DeliveryDate,
                PaymentTerms = input.PaymentTerms,
                IdempotencyKey = idempotencyKey,
                IssuedAt = now,
                PoBaseNumber = baseNumber,
                PoSuffix = suffix,
                AdvanceTypeId = advanceType.Id,
                AdvancePct = input.AdvancePct,
                AdvanceAmount = input.AdvanceAmount,
                AdvancePaid = 0,
                CreatedByUserId = _currentUser.UserId,
                CreatedAt = now,
            };
            _db.PurchaseOrders.Add(po);
            await _db.SaveChangesAsync(ct);

            foreach (var line in input.Lines)
            {
                _db.PoLines.Add(new PoLines
                {
                    PoId = po.Id,
                    PrLineId = line.PrLineId,
                    Qty = line.Qty,
                    UnitPrice = line.UnitPrice,
                    AcceptedQty = 0,
                });
            }

            var contractType = await _db.ContractTypes.FirstAsync(t => t.Code == ContractTypeCodes.Supply, ct);
            var template = await _db.ContractTemplates.Include(t => t.Clauses).FirstOrDefaultAsync(t => t.IsActive, ct);
            var terms = template != null
                ? string.Join("\n\n", template.Clauses.OrderBy(c => c.Sequence).Select(c => $"{c.Title}: {c.Body}"))
                : "Standard supply terms apply.";

            _db.Contracts.Add(new Contracts
            {
                PoId = po.Id,
                ContractTypeId = contractType.Id,
                Terms = terms,
                TemplateId = template?.Id,
                GoverningLaw = "Laws of Pakistan",
                CreatedByUserId = _currentUser.UserId,
                CreatedAt = now,
            });

            createdIds.Add(po.Id);
        }

        await _db.SaveChangesAsync(ct);

        var actorRoleId = (await _db.Roles.FirstAsync(r => r.Code == RoleCodes.Procurement, ct)).Id;
        var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Complete, _currentUser.UserId, actorRoleId, null, new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount }, ct);
        await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);
        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
        return createdIds;
    }
}
