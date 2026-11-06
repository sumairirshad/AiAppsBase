namespace Procurement.Domain.Entities;

public class AuditEvents
{
    public long Id { get; set; }
    public DateTime OccurredAt { get; set; }
    public long? ActorUserId { get; set; }
    public long? ActorRoleId { get; set; }
    public string Action { get; set; } = string.Empty;
    public short EntityTypeId { get; set; }
    public long? EntityId { get; set; }
    public string Outcome { get; set; } = string.Empty;
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public Guid CorrelationId { get; set; }
    public string? IpAddress { get; set; }
}
