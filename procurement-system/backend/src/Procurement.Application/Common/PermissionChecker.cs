using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Common;

public class PermissionChecker : IPermissionChecker
{
    private readonly IApplicationDbContext _db;
    private readonly UserAccessService _access;

    public PermissionChecker(IApplicationDbContext db, UserAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async Task<bool> HasPermissionAsync(long userId, string permissionCode, CancellationToken ct = default)
    {
        var roleIds = (await _access.GetAssignmentsAsync(userId, ct)).Select(a => a.RoleId).Distinct().ToList();
        if (roleIds.Count == 0) return false;

        return await _db.RolePermissions
            .Join(_db.Permissions, rp => rp.PermissionId, p => p.Id, (rp, p) => new { rp.RoleId, p.Code })
            .AnyAsync(x => roleIds.Contains(x.RoleId) && x.Code == permissionCode, ct);
    }

    public async Task RequireAsync(long userId, string permissionCode, CancellationToken ct = default)
    {
        if (!await HasPermissionAsync(userId, permissionCode, ct))
            throw new UnauthorizedAccessException($"User {userId} lacks permission '{permissionCode}'.");
    }
}
