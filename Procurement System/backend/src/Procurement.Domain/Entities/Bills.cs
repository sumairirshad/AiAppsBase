namespace Procurement.Domain.Entities;

public class SupplierInvoices : AuditableEntity
{
    public string InvoiceNo { get; set; } = default!;
    public long VendorId { get; set; }
    public Vendors Vendor { get; set; } = default!;
    public string VendorInvoiceRef { get; set; } = default!;
    public string VendorRefNormalized { get; set; } = default!;
    public long PrId { get; set; }
    public PurchaseRequisitions Pr { get; set; } = default!;
    public long? PoId { get; set; }
    public PurchaseOrders? Po { get; set; }
    public DateOnly InvoiceDate { get; set; }
    public string CurrencyCode { get; set; } = "PKR";
    public decimal Total { get; set; }
    public long DocumentId { get; set; }
    public Documents Document { get; set; } = default!;
    public long UploadedBy { get; set; }
    public Users UploadedByUser { get; set; } = default!;
    public DateTime? ForwardedToFinanceAt { get; set; }
    public long? ForwardedBy { get; set; }
    public Users? ForwardedByUser { get; set; }
    public string BillStatus { get; set; } = "Uploaded";
    public string? FinancePortalRef { get; set; }
    public decimal PaidAmount { get; set; }
    public bool IsFullyPaid { get; set; }
    public DateTime? PaidAt { get; set; }
    public long? ProofDocumentId { get; set; }
    public Documents? ProofDocument { get; set; }
}
