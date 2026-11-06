namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class MarketSurveys : AuditableEntity
{
    public long Id { get; set; }
    public long ItemId { get; set; }
    public long? LocationId { get; set; }
    public decimal SurveyedPrice { get; set; }
    public string CurrencyCode { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public DateOnly SurveyedOn { get; set; }
    public long SurveyedBy { get; set; }
    public bool IsStale { get; set; } = false;
}
