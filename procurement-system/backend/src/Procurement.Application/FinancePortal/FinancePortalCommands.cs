using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Alerts;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.FinancePortal;

// BR-041: paid amount/date/reference/proof come back from outside the procurement system and
// are written ONLY here - SupplierInvoices.PaidAmount/PaidAt/ProofDocumentId are otherwise
// read-only. A bill is fully paid once PaidAmount reaches its Total (IsFullyPaid is computed,
// never stored). Idempotent: the same callback twice never double-counts or double-alerts.
public record PaymentCallbackCommand(string FinancePortalRef, decimal PaidAmount, DateTime PaidAt, long? ProofDocumentId) : IRequest;

public class PaymentCallbackHandler : IRequestHandler<PaymentCallbackCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly NotificationService _notifications;

    public PaymentCallbackHandler(IApplicationDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task Handle(PaymentCallbackCommand request, CancellationToken ct)
    {
        var invoice = await _db.Set<SupplierInvoices>().FirstOrDefaultAsync(i => i.FinancePortalRef == request.FinancePortalRef, ct)
            ?? throw new InvalidOperationException($"No bill with Finance Portal reference '{request.FinancePortalRef}'.");

        var dedupeKey = $"PaymentConfirmed:{invoice.Id}:{request.PaidAmount}";
        if (await _db.Set<Notifications>().AnyAsync(n => n.DedupeKey.StartsWith(dedupeKey), ct)) return; // idempotent retry

        invoice.PaidAmount = request.PaidAmount;
        invoice.PaidAt = request.PaidAt;
        if (request.ProofDocumentId.HasValue) invoice.ProofDocumentId = request.ProofDocumentId;
        await _db.SaveChangesAsync(ct);

        // NTF-012: payment confirmed notifies Procurement, the Requestor and Audit.
        var pr = invoice.PrId > 0 ? await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == invoice.PrId, ct) : null;
        var message = $"Payment of {request.PaidAmount:N2} confirmed for bill {invoice.InvoiceNo}.";
        if (pr is not null) await _notifications.NotifyUserAsync(pr.RequesterId, "SupplierInvoice", invoice.Id, message, "PaymentConfirmed", $"{dedupeKey}:requester", ct);
        await _notifications.NotifyRoleAsync("PROCUREMENT", null, "SupplierInvoice", invoice.Id, message, "PaymentConfirmed", $"{dedupeKey}:procurement", ct);
        await _notifications.NotifyRoleAsync("AUDIT", null, "SupplierInvoice", invoice.Id, message, "PaymentConfirmed", $"{dedupeKey}:audit", ct);
    }
}

// Dev/demo-only: stands in for the real Finance Portal so the whole loop can be exercised
// without that external system. Never exposed outside a development environment (see
// Api/Controllers/FinancePortalController.cs).
public record SimulatePaymentCommand(long InvoiceId, decimal? PartialAmount) : IRequest<PaymentCallbackCommand>;

public class SimulatePaymentHandler : IRequestHandler<SimulatePaymentCommand, PaymentCallbackCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IMediator _mediator;

    public SimulatePaymentHandler(IApplicationDbContext db, IMediator mediator)
    {
        _db = db;
        _mediator = mediator;
    }

    public async Task<PaymentCallbackCommand> Handle(SimulatePaymentCommand request, CancellationToken ct)
    {
        var invoice = await _db.Set<SupplierInvoices>().FirstOrDefaultAsync(i => i.Id == request.InvoiceId, ct)
            ?? throw new InvalidOperationException("Bill not found.");
        if (invoice.FinancePortalRef is null) throw new InvalidOperationException("This bill has not been forwarded to the Finance Portal yet.");

        var amount = request.PartialAmount ?? (invoice.Total - invoice.PaidAmount);
        var command = new PaymentCallbackCommand(invoice.FinancePortalRef, invoice.PaidAmount + amount, DateTime.UtcNow, ProofDocumentId: null);
        await _mediator.Send(command, ct);
        return command;
    }
}
