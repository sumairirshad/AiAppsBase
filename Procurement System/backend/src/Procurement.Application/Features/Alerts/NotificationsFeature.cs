using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Features.Alerts;

public record NotificationDto(long Id, string Message, bool IsRead, DateTime CreatedAt, string NotificationTypeCode, short EntityTypeId, long EntityId);

public record ListMyNotificationsQuery(bool UnreadOnly) : IRequest<List<NotificationDto>>;

public class ListMyNotificationsQueryHandler : IRequestHandler<ListMyNotificationsQuery, List<NotificationDto>>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;

    public ListMyNotificationsQueryHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<NotificationDto>> Handle(ListMyNotificationsQuery request, CancellationToken ct)
    {
        var roleCodes = (await _currentUser.GetRoleAssignmentsAsync()).Select(a => a.RoleCode).Distinct().ToList();
        var roleIds = await _db.Roles.Where(r => roleCodes.Contains(r.Code)).Select(r => r.Id).ToListAsync(ct);

        var query = _db.Notifications.Where(n => n.UserId == _currentUser.UserId || (n.RoleId != null && roleIds.Contains(n.RoleId.Value)));
        if (request.UnreadOnly) query = query.Where(n => !n.IsRead);

        var notificationTypes = await _db.NotificationTypes.ToDictionaryAsync(t => t.Id, ct);
        var items = await query.OrderByDescending(n => n.CreatedAt).Take(200).ToListAsync(ct);

        return items.Select(n => new NotificationDto(n.Id, n.Message, n.IsRead, n.CreatedAt, notificationTypes[n.NotificationTypeId].Code, n.EntityTypeId, n.EntityId)).ToList();
    }
}

public record MarkNotificationReadCommand(long NotificationId) : IRequest;

public class MarkNotificationReadCommandHandler : IRequestHandler<MarkNotificationReadCommand>
{
    private readonly IProcurementDbContext _db;
    public MarkNotificationReadCommandHandler(IProcurementDbContext db) => _db = db;

    public async Task Handle(MarkNotificationReadCommand request, CancellationToken ct)
    {
        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == request.NotificationId, ct)
            ?? throw new NotFoundException("Notification", request.NotificationId);
        notification.IsRead = true;
        await _db.SaveChangesAsync(ct);
    }
}
