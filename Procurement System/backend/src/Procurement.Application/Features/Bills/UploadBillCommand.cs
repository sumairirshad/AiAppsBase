using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Common.Numbering;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Bills;

public record UploadBillCommand(long PrId, long? PoId, long VendorId, string VendorInvoiceRef, DateOnly InvoiceDate, decimal Total, long DocumentId) : IRequest<long>;

public class UploadBillCommandHandler : IRequestHandler<UploadBillCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;

    public UploadBillCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<long> Handle(UploadBillCommand request, CancellationToken ct)
    {
        if (!await _currentUser.HasRoleAsync(RoleCodes.Procurement))
        {
            throw new ForbiddenAccessException("Only Procurement may upload a vendor bill.");
        }

        if (request.PoId != null)
        {
            var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == request.PoId, ct)
                ?? throw new NotFoundException("PurchaseOrder", request.PoId);
            if (po.VendorId != request.VendorId)
            {
                throw new BusinessRuleException("The bill's vendor does not match the purchase order's vendor.");
            }
        }

        var normalizedRef = request.VendorInvoiceRef.Trim().ToUpperInvariant();
        if (await _db.SupplierInvoices.AnyAsync(i => i.VendorId == request.VendorId && i.VendorRefNormalized == normalizedRef, ct))
        {
            throw new ConflictException("This vendor invoice reference has already been uploaded.");
        }

        var now = DateTime.UtcNow;
        var invoice = new SupplierInvoices
        {
            InvoiceNo = await DocumentNumberGenerator.NextAsync(_db, "seq_invoice", "INV", 5, ct),
            VendorId = request.VendorId,
            VendorInvoiceRef = request.VendorInvoiceRef,
            VendorRefNormalized = normalizedRef,
            PrId = request.PrId,
            PoId = request.PoId,
            InvoiceDate = request.InvoiceDate,
            CurrencyCode = "PKR",
            Total = request.Total,
            DocumentId = request.DocumentId,
            UploadedBy = _currentUser.UserId,
            BillStatus = "Uploaded",
            PaidAmount = 0,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        };
        _db.SupplierInvoices.Add(invoice);
        await _db.SaveChangesAsync(ct);
        return invoice.Id;
    }
}

public record ListBillsForPrQuery(long PrId) : IRequest<List<SupplierInvoiceDto>>;

public class ListBillsForPrQueryHandler : IRequestHandler<ListBillsForPrQuery, List<SupplierInvoiceDto>>
{
    private readonly IProcurementDbContext _db;
    public ListBillsForPrQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<SupplierInvoiceDto>> Handle(ListBillsForPrQuery request, CancellationToken ct)
    {
        var invoices = await _db.SupplierInvoices.Where(i => i.PrId == request.PrId).ToListAsync(ct);
        var vendors = await _db.Vendors.ToDictionaryAsync(v => v.Id, ct);

        return invoices.Select(i => new SupplierInvoiceDto(
            i.Id, i.InvoiceNo, i.VendorId, vendors[i.VendorId].LegalName, i.VendorInvoiceRef, i.PrId, i.PoId,
            i.InvoiceDate, i.Total, i.BillStatus, i.PaidAmount, i.IsFullyPaid, i.PaidAt, i.FinancePortalRef)).ToList();
    }
}
