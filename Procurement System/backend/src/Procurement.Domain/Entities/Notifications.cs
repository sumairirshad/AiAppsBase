namespace Procurement.Domain.Entities;

public class Notifications : Entity
{
    public long? UserId { get; set; }
    public Users? User { get; set; }
    public long? RoleId { get; set; }
    public Roles? Role { get; set; }
    public short EntityTypeId { get; set; }
    public long EntityId { get; set; }
    public string Message { get; set; } = default!;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public short NotificationTypeId { get; set; }
    public string Channel { get; set; } = "InApp";
    public string DedupeKey { get; set; } = default!;
    public DateTime? SentAt { get; set; }
}

public class OutboxMessages : Entity
{
    public string MessageType { get; set; } = default!;
    public string Payload { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public int Attempts { get; set; }
    public DateTime? NextAttemptAt { get; set; }
    public string? LastError { get; set; }
}
