using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Features.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Constants;

namespace Procurement.Application.Features.Bills;

public record ForwardBillCommand(long InvoiceId) : IRequest;

/// <summary>Procurement forwards an uploaded bill to the Finance Portal. Marks it Forwarded; the PR itself
/// only advances once every bill is forwarded, via <see cref="SimulateFinancePortalPaymentCommand"/>.</summary>
public class ForwardBillCommandHandler : IRequestHandler<ForwardBillCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;

    public ForwardBillCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(ForwardBillCommand request, CancellationToken ct)
    {
        if (!await _currentUser.HasRoleAsync(RoleCodes.Procurement))
        {
            throw new ForbiddenAccessException("Only Procurement may forward a bill to the Finance Portal.");
        }

        var invoice = await _db.SupplierInvoices.FirstOrDefaultAsync(i => i.Id == request.InvoiceId, ct)
            ?? throw new NotFoundException("SupplierInvoice", request.InvoiceId);
        if (invoice.BillStatus != "Uploaded")
        {
            throw new BusinessRuleException("This bill has already been forwarded.");
        }

        var now = DateTime.UtcNow;
        invoice.BillStatus = "Forwarded";
        invoice.ForwardedToFinanceAt = now;
        invoice.ForwardedBy = _currentUser.UserId;
        invoice.UpdatedByUserId = _currentUser.UserId;
        invoice.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
    }
}

public record CompleteBillUploadCommand(long PrId) : IRequest;

/// <summary>Advances a sourcing/cyclic-items PR from BillPending to the Finance Portal sync stage once every
/// uploaded bill has been forwarded. (Pure bill-route PRs have no BILL_UPLOAD stage at all - their PR reaches
/// WithFinancePortal straight from Finance's own approval.)</summary>
public class CompleteBillUploadCommandHandler : IRequestHandler<CompleteBillUploadCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public CompleteBillUploadCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(CompleteBillUploadCommand request, CancellationToken ct)
    {
        if (!await _currentUser.HasRoleAsync(RoleCodes.Procurement))
        {
            throw new ForbiddenAccessException("Only Procurement may complete bill upload.");
        }

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        var invoices = await _db.SupplierInvoices.Where(i => i.PrId == pr.Id).ToListAsync(ct);
        if (invoices.Count == 0 || invoices.Any(i => i.BillStatus == "Uploaded"))
        {
            throw new BusinessRuleException("Every bill for this purchase requisition must be uploaded and forwarded first.");
        }

        var now = DateTime.UtcNow;
        var actorRoleId = (await _db.Roles.FirstAsync(r => r.Code == RoleCodes.Procurement, ct)).Id;
        var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Complete, _currentUser.UserId, actorRoleId, null, new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount }, ct);
        await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);
        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
    }
}

public record SimulateFinancePortalPaymentCommand(long PrId) : IRequest;

/// <summary>Stands in for the Finance Portal's payment webhook (there is no live integration in this build).
/// Marks every forwarded bill for the PR as fully paid - or, for a pure bill-route PR with no uploaded
/// SupplierInvoice, pays the PrBills amount directly - and advances the PR to Audit's final verification.
/// Idempotent: calling it again when already paid is a no-op.</summary>
public class SimulateFinancePortalPaymentCommandHandler : IRequestHandler<SimulateFinancePortalPaymentCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public SimulateFinancePortalPaymentCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(SimulateFinancePortalPaymentCommand request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        var syncStatus = await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.WithFinancePortal, ct);
        if (pr.PrStatusId != syncStatus.Id)
        {
            throw new BusinessRuleException("This purchase requisition is not awaiting Finance Portal payment.");
        }

        var now = DateTime.UtcNow;
        var financePortalRef = $"FP-{pr.PrNumber}-{now:yyyyMMddHHmmss}";

        var invoices = await _db.SupplierInvoices.Where(i => i.PrId == pr.Id).ToListAsync(ct);
        foreach (var invoice in invoices.Where(i => !i.IsFullyPaid))
        {
            invoice.PaidAmount = invoice.Total;
            invoice.PaidAt = now;
            invoice.FinancePortalRef = financePortalRef;
        }

        await _db.SaveChangesAsync(ct);

        var actorRoleId = (await _db.Roles.FirstAsync(r => r.Code == RoleCodes.System, ct)).Id;
        var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Complete, _currentUser.UserId, actorRoleId, "Finance Portal payment confirmed.", new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount }, ct);
        await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);
        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
    }
}
