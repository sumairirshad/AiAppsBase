using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Alerts;

// BR-050: the notification event matrix, with de-duplication on retry (UNIQUE(DedupeKey)) -
// every other module calls this instead of inserting Notifications rows itself. In-app rows
// are written synchronously (in the same transaction as the business change); the actual
// email/WhatsApp send happens later, out of process, via the OutboxDispatcher worker job
// reading OutboxMessages this also writes.
public class NotificationService
{
    private readonly IApplicationDbContext _db;
    private readonly LookupCache _lookups;

    public NotificationService(IApplicationDbContext db, LookupCache lookups)
    {
        _db = db;
        _lookups = lookups;
    }

    public async Task NotifyUserAsync(long userId, string entityTypeCode, long entityId, string message, string notificationTypeCode, string dedupeKey, CancellationToken ct = default)
    {
        if (await _db.Set<Notifications>().AnyAsync(n => n.DedupeKey == dedupeKey, ct)) return;

        var entityTypeId = await _lookups.IdAsync<Domain.Entities.EntityTypes, short>(entityTypeCode, ct);
        var notificationTypeId = await _lookups.IdAsync<NotificationTypes, short>(notificationTypeCode, ct);

        _db.Set<Notifications>().Add(new Notifications
        {
            UserId = userId,
            EntityTypeId = entityTypeId,
            EntityId = entityId,
            Message = message,
            CreatedAt = DateTime.UtcNow,
            NotificationTypeId = notificationTypeId,
            DedupeKey = dedupeKey,
        });
        _db.Set<OutboxMessages>().Add(new OutboxMessages
        {
            MessageType = "Notification.Email",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { userId, message, notificationTypeCode }),
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
    }

    public async Task NotifyRoleAsync(string roleCode, long? scopeDepartmentId, string entityTypeCode, long entityId, string message, string notificationTypeCode, string dedupeKey, CancellationToken ct = default)
    {
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Code == roleCode, ct);
        if (role is null) return;

        var userIds = await _db.UserRoleAssignments
            .Where(a => a.RoleId == role.Id && (scopeDepartmentId == null || a.DepartmentId == null || a.DepartmentId == scopeDepartmentId))
            .Select(a => a.UserId).Distinct().ToListAsync(ct);

        foreach (var userId in userIds)
            await NotifyUserAsync(userId, entityTypeCode, entityId, message, notificationTypeCode, $"{dedupeKey}:{userId}", ct);
    }

    // BR-030/FEAT-016: a higher-than-lowest quote notifies HOD, Procurement, Finance, Audit
    // and OPD - everyone involved, not just the approver who has to act on it.
    public async Task NotifyHighQuoteAsync(long prId, long departmentId, string message, CancellationToken ct = default)
    {
        foreach (var roleCode in new[] { "HOD", "PROCUREMENT", "FINANCE", "AUDIT", "OPD" })
            await NotifyRoleAsync(roleCode, roleCode == "HOD" ? departmentId : null, "PurchaseRequisition", prId, message, "HighQuoteAlert", $"HighQuote:{prId}:{roleCode}", ct);
    }
}
