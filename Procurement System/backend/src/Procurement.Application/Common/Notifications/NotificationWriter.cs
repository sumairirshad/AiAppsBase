using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Common.Notify;

public static class NotificationWriter
{
    public static async Task AddAsync(
        IProcurementDbContext db, string notificationTypeCode, short entityTypeId, long entityId,
        string message, string dedupeKey, CancellationToken ct, long? userId = null, long? roleId = null)
    {
        if (await db.Notifications.AnyAsync(n => n.DedupeKey == dedupeKey, ct)) return;

        var notificationType = await db.NotificationTypes.FirstAsync(t => t.Code == notificationTypeCode, ct);
        db.Notifications.Add(new Notifications
        {
            UserId = userId,
            RoleId = roleId,
            EntityTypeId = entityTypeId,
            EntityId = entityId,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            NotificationTypeId = notificationType.Id,
            Channel = "InApp",
            DedupeKey = dedupeKey,
        });
    }
}
