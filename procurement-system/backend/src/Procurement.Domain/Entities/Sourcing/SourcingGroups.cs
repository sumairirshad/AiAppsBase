namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class SourcingGroups : AuditableEntity
{
    public long Id { get; set; }
    public long PrId { get; set; }
    public int GroupNo { get; set; }
    public long? CategoryId { get; set; }
    public decimal GroupAmount { get; set; }
    public byte RequiredQuotes { get; set; }
    public long QuotationRuleId { get; set; }
    public long? RecommendedQuotationId { get; set; }
    public long? SelectedQuotationId { get; set; }
    public string? SelectionJustification { get; set; }
    public long? SelectedBy { get; set; }
    public long? OpdDecisionBy { get; set; }
}
