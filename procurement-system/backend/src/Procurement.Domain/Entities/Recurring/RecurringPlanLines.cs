namespace Procurement.Domain.Entities;

public class RecurringPlanLines
{
    public long Id { get; set; }
    public long PlanId { get; set; }
    public long ItemId { get; set; }
    public decimal Qty { get; set; }
    public long UnitId { get; set; }
    public decimal? AgreedPrice { get; set; }
}
