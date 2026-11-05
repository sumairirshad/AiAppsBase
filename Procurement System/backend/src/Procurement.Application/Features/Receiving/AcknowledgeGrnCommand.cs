using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Features.Requisitions;
using Procurement.Application.Features.VendorManagement;
using Procurement.Application.Workflow;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Receiving;

public record AcknowledgeGrnCommand(long GrnId, bool Accept, byte? QualityRating, string? Remarks, string? DisputeReason) : IRequest;

/// <summary>The requestor acknowledges a GRN once all PO lines for the PR are fully received. Accepting
/// feeds the vendor's on-time/quality score and advances the PR to bill upload; disputing leaves the PR where
/// it is and records the dispute for Procurement to resolve (no formal stage regression in this build).</summary>
public class AcknowledgeGrnCommandHandler : IRequestHandler<AcknowledgeGrnCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public AcknowledgeGrnCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(AcknowledgeGrnCommand request, CancellationToken ct)
    {
        var grn = await _db.GoodsReceipts.FirstOrDefaultAsync(g => g.Id == request.GrnId, ct)
            ?? throw new NotFoundException("GoodsReceipt", request.GrnId);
        var po = await _db.PurchaseOrders.FirstAsync(p => p.Id == grn.PoId, ct);
        var pr = await _db.PurchaseRequisitions.FirstAsync(p => p.Id == po.PrId, ct);

        if (pr.RequesterId != _currentUser.UserId)
        {
            throw new ForbiddenAccessException("Only the requester may acknowledge this delivery.");
        }

        var now = DateTime.UtcNow;
        grn.AcknowledgedBy = _currentUser.UserId;
        grn.AcknowledgedAt = now;
        grn.AckRemarks = request.Remarks;

        if (!request.Accept)
        {
            if (string.IsNullOrWhiteSpace(request.DisputeReason))
            {
                throw new BusinessRuleException("A reason is required to dispute a delivery.");
            }
            grn.AckStatus = "Disputed";
            grn.DisputeReason = request.DisputeReason;
            await _db.SaveChangesAsync(ct);
            return;
        }

        grn.AckStatus = "Accepted";
        grn.QualityRating = request.QualityRating;
        await _db.SaveChangesAsync(ct);

        await VendorScoring.RecalculateAsync(_db, po.VendorId, ct);

        var allPoLines = await (
            from l in _db.PoLines
            join otherPo in _db.PurchaseOrders on l.PoId equals otherPo.Id
            where otherPo.PrId == pr.Id
            select l
        ).ToListAsync(ct);
        var allGrns = await (
            from g in _db.GoodsReceipts
            join otherPo in _db.PurchaseOrders on g.PoId equals otherPo.Id
            where otherPo.PrId == pr.Id
            select g
        ).ToListAsync(ct);

        var fullyReceived = allPoLines.All(l => l.Qty - l.AcceptedQty <= 0);
        var allAcknowledged = allGrns.All(g => g.AckStatus == "Accepted");

        if (fullyReceived && allAcknowledged)
        {
            var actorRoleId = (await _db.Roles.FirstAsync(r => r.Code == RoleCodes.Requestor, ct)).Id;
            var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Complete, _currentUser.UserId, actorRoleId, null, new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount }, ct);
            await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);
            pr.UpdatedByUserId = _currentUser.UserId;
            pr.UpdatedAt = now;
            await _db.SaveChangesAsync(ct);
        }
    }
}

public record ListGrnsForPrQuery(long PrId) : IRequest<List<GrnDto>>;

public class ListGrnsForPrQueryHandler : IRequestHandler<ListGrnsForPrQuery, List<GrnDto>>
{
    private readonly IProcurementDbContext _db;
    public ListGrnsForPrQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<GrnDto>> Handle(ListGrnsForPrQuery request, CancellationToken ct)
    {
        var poIds = await _db.PurchaseOrders.Where(p => p.PrId == request.PrId).Select(p => p.Id).ToListAsync(ct);
        var pos = await _db.PurchaseOrders.Where(p => poIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
        var grns = await _db.GoodsReceipts.Where(g => poIds.Contains(g.PoId)).ToListAsync(ct);
        var lines = await (
            from l in _db.GoodsReceiptLines
            join pl in _db.PoLines on l.PoLineId equals pl.Id
            join prl in _db.PrLines on pl.PrLineId equals prl.Id
            join i in _db.Items on prl.ItemId equals i.Id
            where grns.Select(g => g.Id).Contains(l.GrnId)
            select new { l.GrnId, Dto = new GrnLineDto(l.PoLineId, i.Name, l.DeliveredQty, l.AcceptedQty, l.RejectedQty, l.RejectReason) }
        ).ToListAsync(ct);

        return grns.Select(g => new GrnDto(
            g.Id, g.GrnNumber, g.PoId, pos[g.PoId].PoNumber, g.ReceivedOn, g.DeliveryNoteNo, g.OnTime, g.QualityRating,
            g.AckStatus, g.DisputeReason, lines.Where(l => l.GrnId == g.Id).Select(l => l.Dto).ToList())).ToList();
    }
}
