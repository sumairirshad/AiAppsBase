namespace Procurement.Domain.Entities;

public class Notifications
{
    public long Id { get; set; }
    public long? UserId { get; set; }
    public long? RoleId { get; set; }
    public short EntityTypeId { get; set; }
    public long EntityId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public short NotificationTypeId { get; set; }
    public string Channel { get; set; } = string.Empty;
    public string DedupeKey { get; set; } = string.Empty;
    public DateTime? SentAt { get; set; }
}
