namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class PrBills : AuditableEntity
{
    public long Id { get; set; }
    public long PrId { get; set; }
    public string BillingPeriod { get; set; } = string.Empty;
    public decimal BillAmount { get; set; }
    public string Purpose { get; set; } = string.Empty;
    public DateOnly DueDate { get; set; }
    public long BillDocumentId { get; set; }
    public long? PayeeVendorId { get; set; }
}
