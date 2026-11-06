namespace Procurement.Domain.Entities;

public class RecurringOccurrences
{
    public long Id { get; set; }
    public long PlanId { get; set; }
    public int PlanVersionNo { get; set; }
    public string OccurrenceKey { get; set; } = string.Empty;
    public DateOnly ScheduledFor { get; set; }
    public short OccurrenceStatusId { get; set; }
    public long? GeneratedPrId { get; set; }
    public DateTime? GeneratedAt { get; set; }
    public string? Error { get; set; }
}
