namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class MonthEndAudits : AuditableEntity
{
    public long Id { get; set; }
    public string Period { get; set; } = string.Empty;
    public short StatusId { get; set; }
    public long StartedBy { get; set; }
    public long? CompletedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Summary { get; set; }
}
