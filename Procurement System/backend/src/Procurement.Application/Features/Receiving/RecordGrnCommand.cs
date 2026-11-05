using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Common.Numbering;
using Procurement.Application.Features.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Receiving;

public record RecordGrnCommand(long PoId, DateOnly ReceivedOn, string DeliveryNoteNo, long? DeliveryNoteDocumentId, List<GrnLineInput> Lines) : IRequest<long>;

public class RecordGrnCommandHandler : IRequestHandler<RecordGrnCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public RecordGrnCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task<long> Handle(RecordGrnCommand request, CancellationToken ct)
    {
        if (!await _currentUser.HasRoleAsync(RoleCodes.Procurement))
        {
            throw new ForbiddenAccessException("Only Procurement may record a goods receipt.");
        }
        if (string.IsNullOrWhiteSpace(request.DeliveryNoteNo))
        {
            throw new BusinessRuleException("A delivery note number is required.");
        }

        var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == request.PoId, ct)
            ?? throw new NotFoundException("PurchaseOrder", request.PoId);
        var poLines = await _db.PoLines.Where(l => l.PoId == po.Id).ToListAsync(ct);

        foreach (var line in request.Lines)
        {
            var poLine = poLines.FirstOrDefault(l => l.Id == line.PoLineId) ?? throw new NotFoundException("PoLine", line.PoLineId);
            if (line.AcceptedQty + line.RejectedQty > line.DeliveredQty)
            {
                throw new BusinessRuleException("Accepted plus rejected quantity cannot exceed delivered quantity.");
            }
            var outstanding = poLine.Qty - poLine.AcceptedQty;
            if (line.AcceptedQty > outstanding)
            {
                throw new BusinessRuleException($"Accepted quantity exceeds the outstanding quantity ({outstanding}) for this PO line.");
            }
            if (line.RejectedQty > 0 && string.IsNullOrWhiteSpace(line.RejectReason))
            {
                throw new BusinessRuleException("A reason is required for rejected quantity.");
            }
        }

        var now = DateTime.UtcNow;
        var isLate = request.ReceivedOn > po.DeliveryDate;
        var grn = new GoodsReceipts
        {
            GrnNumber = await DocumentNumberGenerator.NextAsync(_db, "seq_grn", "GRN", 5, ct),
            PoId = po.Id,
            ReceivedOn = request.ReceivedOn,
            DeliveryNoteNo = request.DeliveryNoteNo,
            ReceivedBy = _currentUser.UserId,
            IsLate = isLate,
            DeliveryNoteDocumentId = request.DeliveryNoteDocumentId,
            OnTime = !isLate,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        };
        _db.GoodsReceipts.Add(grn);
        await _db.SaveChangesAsync(ct);

        foreach (var line in request.Lines)
        {
            _db.GoodsReceiptLines.Add(new GoodsReceiptLines
            {
                GrnId = grn.Id,
                PoLineId = line.PoLineId,
                DeliveredQty = line.DeliveredQty,
                AcceptedQty = line.AcceptedQty,
                RejectedQty = line.RejectedQty,
                RejectReason = line.RejectReason,
                EvidenceDocumentId = line.EvidenceDocumentId,
            });

            var poLine = poLines.First(l => l.Id == line.PoLineId);
            poLine.AcceptedQty += line.AcceptedQty;

            var prLine = await _db.PrLines.FirstAsync(l => l.Id == poLine.PrLineId, ct);
            prLine.AcceptedQty += line.AcceptedQty;
        }

        await _db.SaveChangesAsync(ct);

        var fullyReceived = poLines.All(l => l.Qty - l.AcceptedQty <= 0);
        var partialStatus = await _db.PoStatuses.FirstAsync(s => s.Code == PoStatusCodes.PartiallyReceived, ct);
        var receivedStatus = await _db.PoStatuses.FirstAsync(s => s.Code == PoStatusCodes.Received, ct);
        po.PoStatusId = fullyReceived ? receivedStatus.Id : partialStatus.Id;

        var pr = await _db.PurchaseRequisitions.FirstAsync(p => p.Id == po.PrId, ct);
        var allPoLines = await (
            from l in _db.PoLines
            join otherPo in _db.PurchaseOrders on l.PoId equals otherPo.Id
            where otherPo.PrId == pr.Id
            select l
        ).ToListAsync(ct);

        if (allPoLines.All(l => l.Qty - l.AcceptedQty <= 0))
        {
            var actorRoleId = (await _db.Roles.FirstAsync(r => r.Code == RoleCodes.Procurement, ct)).Id;
            var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Complete, _currentUser.UserId, actorRoleId, null, new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount }, ct);
            await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);
        }
        else
        {
            var partiallyReceivedPrStatus = await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.PartiallyReceived, ct);
            pr.PrStatusId = partiallyReceivedPrStatus.Id;
        }

        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);

        return grn.Id;
    }
}
