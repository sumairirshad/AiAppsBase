namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class Quotations : AuditableEntity
{
    public long Id { get; set; }
    public long PrId { get; set; }
    public long VendorId { get; set; }
    public string QuotationNo { get; set; } = string.Empty;
    public DateOnly QuotationDate { get; set; }
    public string CurrencyCode { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public DateOnly? ValidUntil { get; set; }
    public long DocumentId { get; set; }
    public long SourcingGroupId { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal ComparableTotal { get; set; }
}
