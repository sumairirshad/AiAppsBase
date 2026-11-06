namespace Procurement.Domain.Entities;

public class MonthEndAuditItems
{
    public long Id { get; set; }
    public long MonthEndAuditId { get; set; }
    public long PrId { get; set; }
    public long? BillId { get; set; }
    public bool WasPreAudited { get; set; }
    public string? Finding { get; set; }
}
