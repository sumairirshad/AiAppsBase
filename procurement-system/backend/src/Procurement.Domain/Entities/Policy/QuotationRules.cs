namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class QuotationRules : AuditableEntity
{
    public long Id { get; set; }
    public long PolicyVersionId { get; set; }
    public long? SpendSubHeadId { get; set; }
    public decimal? MinAmount { get; set; }
    public decimal? MaxAmount { get; set; }
    public bool? StarVendor { get; set; }
    public bool? Emergency { get; set; }
    public byte RequiredQuotes { get; set; }
    public int Priority { get; set; }
    public string Description { get; set; } = string.Empty;
}
