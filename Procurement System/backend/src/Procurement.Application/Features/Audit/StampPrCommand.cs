using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Features.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Audit;

public record StampPrCommand(long PrId, bool PaymentVerified, bool DeliveryVerified, string? Remarks) : IRequest;

/// <summary>Audit's final verification: both payment and delivery must be confirmed before the stamp can be
/// written, which closes the purchase requisition for good (the stamp itself is immutable - a correction is a
/// fresh WorkflowActions entry, never an update to this row).</summary>
public class StampPrCommandHandler : IRequestHandler<StampPrCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public StampPrCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(StampPrCommand request, CancellationToken ct)
    {
        if (!request.PaymentVerified || !request.DeliveryVerified)
        {
            throw new BusinessRuleException("Both payment and delivery must be verified before Audit can stamp this purchase requisition.");
        }
        if (!await _currentUser.HasRoleAsync(RoleCodes.Audit))
        {
            throw new ForbiddenAccessException("Only Audit may stamp a purchase requisition closed.");
        }

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        if (await _db.AuditStamps.AnyAsync(s => s.PrId == pr.Id, ct))
        {
            throw new BusinessRuleException("This purchase requisition has already been stamped.");
        }

        var invoices = await _db.SupplierInvoices.Where(i => i.PrId == pr.Id).ToListAsync(ct);
        if (invoices.Count > 0 && invoices.Any(i => !i.IsFullyPaid))
        {
            throw new BusinessRuleException("Not every bill for this purchase requisition has been fully paid yet.");
        }

        var now = DateTime.UtcNow;
        _db.AuditStamps.Add(new AuditStamps
        {
            PrId = pr.Id,
            PaymentVerified = true,
            DeliveryVerified = true,
            StampedBy = _currentUser.UserId,
            StampedAt = now,
            Remarks = request.Remarks,
        });

        var actorRoleId = (await _db.Roles.FirstAsync(r => r.Code == RoleCodes.Audit, ct)).Id;
        var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Close, _currentUser.UserId, actorRoleId, request.Remarks, new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount }, ct);
        await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);

        pr.FinalAmount ??= pr.ApprovedAmount ?? pr.EstimatedAmount;
        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
    }
}

public record ListAuditStampsQuery(long PrId) : IRequest<AuditStampDto?>;

public class ListAuditStampsQueryHandler : IRequestHandler<ListAuditStampsQuery, AuditStampDto?>
{
    private readonly IProcurementDbContext _db;
    public ListAuditStampsQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<AuditStampDto?> Handle(ListAuditStampsQuery request, CancellationToken ct)
    {
        var stamp = await _db.AuditStamps.FirstOrDefaultAsync(s => s.PrId == request.PrId, ct);
        if (stamp == null) return null;
        var user = await _db.Users.FirstAsync(u => u.Id == stamp.StampedBy, ct);
        return new AuditStampDto(stamp.Id, stamp.PrId, stamp.PaymentVerified, stamp.DeliveryVerified, stamp.StampedAt, user.DisplayName, stamp.Remarks);
    }
}
