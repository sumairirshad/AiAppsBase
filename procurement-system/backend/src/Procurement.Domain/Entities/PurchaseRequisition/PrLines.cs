namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class PrLines : AuditableEntity
{
    public long Id { get; set; }
    public long PrId { get; set; }
    public int LineNo { get; set; }
    public long ItemId { get; set; }
    public string? Description { get; set; }
    public decimal Qty { get; set; }
    public long UnitId { get; set; }
    public decimal EstUnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public long? SuggestedVendorId { get; set; }
    public long? SourcingGroupId { get; set; }
    public long LocationId { get; set; }
    public decimal AcceptedQty { get; set; }
    public long? AwardedVendorId { get; set; }
    public long? AwardedQuotationLineId { get; set; }
    public string? OverrideReason { get; set; }
    public decimal? MarketPriceAtRequest { get; set; }
    public decimal? LastPaidPriceAtRequest { get; set; }
    public decimal? PriceWarningPct { get; set; }
}
