namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class SupplierInvoices : AuditableEntity
{
    public long Id { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public long VendorId { get; set; }
    public string VendorInvoiceRef { get; set; } = string.Empty;
    public string VendorRefNormalized { get; set; } = string.Empty;
    public long PrId { get; set; }
    public long? PoId { get; set; }
    public DateOnly InvoiceDate { get; set; }
    public string CurrencyCode { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public long DocumentId { get; set; }
    public long UploadedBy { get; set; }
    public DateTime? ForwardedToFinanceAt { get; set; }
    public long? ForwardedBy { get; set; }
    public string BillStatus { get; set; } = string.Empty;
    public string? FinancePortalRef { get; set; }
    public decimal PaidAmount { get; set; }
    public bool IsFullyPaid { get; set; }
    public DateTime? PaidAt { get; set; }
    public long? ProofDocumentId { get; set; }
}
