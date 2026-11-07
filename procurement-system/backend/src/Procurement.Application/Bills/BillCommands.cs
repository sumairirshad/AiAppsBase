using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Bills;

// BR-040: Procurement uploads the vendor's bill against the PO; a duplicate vendor bill
// reference is blocked (UNIQUE(VendorId, VendorRefNormalized)); the bill carries PO, GRN and
// advance details forward to the Finance Portal once forwarded.
public record UploadBillCommand(long ActorUserId, long PrId, long? PoId, long VendorId, string VendorInvoiceRef, DateOnly InvoiceDate, decimal Total, long DocumentId) : IRequest<long>;

public class UploadBillHandler : IRequestHandler<UploadBillCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly IDocumentNumberGenerator _numbers;

    public UploadBillHandler(IApplicationDbContext db, IPermissionChecker permissions, IDocumentNumberGenerator numbers)
    {
        _db = db;
        _permissions = permissions;
        _numbers = numbers;
    }

    public async Task<long> Handle(UploadBillCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "BILL.UPLOAD", ct);
        var normalizedRef = request.VendorInvoiceRef.Trim().ToUpperInvariant();
        var duplicate = await _db.Set<SupplierInvoices>().AnyAsync(i => i.VendorId == request.VendorId && i.VendorRefNormalized == normalizedRef, ct);
        if (duplicate) throw new InvalidOperationException($"Vendor bill reference '{request.VendorInvoiceRef}' has already been uploaded for this vendor.");

        var invoice = new SupplierInvoices
        {
            InvoiceNo = await _numbers.NextAsync(DocumentSequence.Inv, ct),
            VendorId = request.VendorId,
            VendorInvoiceRef = request.VendorInvoiceRef,
            VendorRefNormalized = normalizedRef,
            PrId = request.PrId,
            PoId = request.PoId,
            InvoiceDate = request.InvoiceDate,
            CurrencyCode = "PKR",
            Total = request.Total,
            DocumentId = request.DocumentId,
            UploadedBy = request.ActorUserId,
            BillStatus = "Uploaded",
            CreatedBy = request.ActorUserId,
        };
        _db.Set<SupplierInvoices>().Add(invoice);
        await _db.SaveChangesAsync(ct);
        return invoice.Id;
    }
}

public record ForwardBillCommand(long ActorUserId, long InvoiceId) : IRequest<SubmitPrResult?>;

public class ForwardBillHandler : IRequestHandler<ForwardBillCommand, SubmitPrResult?>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;
    private readonly IWorkflowEngine _workflow;

    public ForwardBillHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups, IWorkflowEngine workflow)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
        _workflow = workflow;
    }

    public async Task<SubmitPrResult?> Handle(ForwardBillCommand request, CancellationToken ct)
    {
        var invoice = await _db.Set<SupplierInvoices>().FirstOrDefaultAsync(i => i.Id == request.InvoiceId, ct)
            ?? throw new InvalidOperationException("Bill not found.");
        // BR-008: BILL_FORWARD escalates to OPD on timeout.
        var forwardWorkflowInstanceId = await _db.PurchaseRequisitions.Where(p => p.Id == invoice.PrId).Select(p => p.WorkflowInstanceId).FirstAsync(ct);
        await _permissions.RequireAsync(request.ActorUserId, "BILL.FORWARD", forwardWorkflowInstanceId, ct);

        invoice.BillStatus = "Forwarded";
        invoice.ForwardedToFinanceAt = DateTime.UtcNow;
        invoice.ForwardedBy = request.ActorUserId;
        invoice.FinancePortalRef = $"FP-{invoice.InvoiceNo}";

        // The API never calls the Finance Portal directly - it writes to the outbox and the
        // Worker's FinancePortalSync job delivers it (architecture spec: "the API never calls
        // outside systems directly").
        _db.Set<OutboxMessages>().Add(new OutboxMessages
        {
            MessageType = "FinancePortal.BillForwarded",
            Payload = System.Text.Json.JsonSerializer.Serialize(new
            {
                invoice.Id, invoice.InvoiceNo, invoice.VendorId, invoice.PoId, invoice.PrId, invoice.Total, invoice.FinancePortalRef,
            }),
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == invoice.PrId, ct);
        if (pr?.WorkflowInstanceId is null) return null;

        // Only WF_SOURCING/WF_CYCLIC_ITEMS have a BILL_FORWARD stage at all - the bill-route
        // workflows (WF_BILL/WF_CYCLIC_BILL) go straight from Finance's approval to the
        // Finance Portal without a Procurement forwarding step (BR-045: no Procurement, no
        // vendor PO), so this only ever advances a purchase-cycle PR; the engine's own
        // task/role check refuses the call otherwise.
        var definitionId = await _db.WorkflowInstances.Where(i => i.Id == pr.WorkflowInstanceId.Value).Select(i => i.DefinitionId).FirstAsync(ct);
        var procurementRoleId = await _lookups.IdAsync<Roles, long>("PROCUREMENT", ct);
        var result = await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
            pr.WorkflowInstanceId.Value, request.ActorUserId, procurementRoleId, WorkflowActionCode.Complete,
            pr.RequesterId, pr.DepartmentId, CurrentAmount: pr.EstimatedAmount), ct);

        var statusId = result.CurrentStageCode is null
            ? await _lookups.IdAsync<PrStatuses, short>("Closed", ct)
            : (await _db.WorkflowStages.FirstOrDefaultAsync(s => s.DefinitionId == definitionId && s.StageCode == result.CurrentStageCode, ct))?.PrStatusId
              ?? await _lookups.IdAsync<PrStatuses, short>("WithFinancePortal", ct);
        pr.PrStatusId = statusId;
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new SubmitPrResult((await _db.PrStatuses.FindAsync(new object[] { statusId }, ct))!.Code, result.NextRole);
    }
}
