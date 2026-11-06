using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Audit;

// BR-043: Audit verifies paid and received, then stamps - an immutable event; the PR closes
// only now, and only when every PO on it is both fully paid and fully received, even if one
// PO finished long ago (BR-009/010). "Paid but not delivered" and "delivered but not paid"
// both stay open; the stamp refuses until both are true.
public record AuditStampCommand(long ActorUserId, long PrId, string? Remarks) : IRequest<SubmitPrResult>;

public class AuditStampHandler : IRequestHandler<AuditStampCommand, SubmitPrResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly IWorkflowEngine _workflow;
    private readonly LookupCache _lookups;

    public AuditStampHandler(IApplicationDbContext db, IPermissionChecker permissions, IWorkflowEngine workflow, LookupCache lookups)
    {
        _db = db;
        _permissions = permissions;
        _workflow = workflow;
        _lookups = lookups;
    }

    public async Task<SubmitPrResult> Handle(AuditStampCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "AUDIT.STAMP", ct);
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        if (await _db.Set<AuditStamps>().AnyAsync(s => s.PrId == pr.Id, ct))
            throw new InvalidOperationException("This PR has already been stamped; a correction is a new audit event, not an edit.");

        var invoices = await _db.Set<SupplierInvoices>().Where(i => i.PrId == pr.Id).ToListAsync(ct);
        var paymentVerified = invoices.Count > 0 && invoices.All(i => i.PaidAmount >= i.Total);

        var pos = await _db.PurchaseOrders.Where(p => p.PrId == pr.Id).ToListAsync(ct);
        var poLines = await _db.Set<PoLines>().Where(l => pos.Select(p => p.Id).Contains(l.PoId)).ToListAsync(ct);
        var deliveryVerified = pos.Count == 0 || poLines.All(l => l.OutstandingQty <= 0);

        if (!paymentVerified || !deliveryVerified)
            throw new InvalidOperationException(
                $"Cannot stamp: {(paymentVerified ? "" : "not fully paid. ")}{(deliveryVerified ? "" : "not fully received.")}");

        _db.Set<AuditStamps>().Add(new AuditStamps
        {
            PrId = pr.Id,
            PaymentVerified = true,
            DeliveryVerified = true,
            StampedBy = request.ActorUserId,
            StampedAt = DateTime.UtcNow,
            Remarks = request.Remarks,
        });
        await _db.SaveChangesAsync(ct);

        if (pr.WorkflowInstanceId is null) throw new InvalidOperationException("This PR has no active workflow instance.");
        var auditRoleId = await _lookups.IdAsync<Roles, long>("AUDIT", ct);
        var result = await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
            pr.WorkflowInstanceId.Value, request.ActorUserId, auditRoleId, WorkflowActionCode.Complete,
            pr.RequesterId, pr.DepartmentId, request.Remarks, pr.EstimatedAmount), ct);

        var closedStatus = await _lookups.IdAsync<PrStatuses, short>("Closed", ct);
        pr.PrStatusId = closedStatus;
        pr.ClosedAt = DateTime.UtcNow;
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new SubmitPrResult("Closed", result.NextRole);
    }
}
