namespace Procurement.Application.Features.Bills;

public record SupplierInvoiceDto(
    long Id, string InvoiceNo, long VendorId, string VendorName, string VendorInvoiceRef, long PrId,
    long? PoId, DateOnly InvoiceDate, decimal Total, string BillStatus, decimal PaidAmount, bool IsFullyPaid,
    DateTime? PaidAt, string? FinancePortalRef);
