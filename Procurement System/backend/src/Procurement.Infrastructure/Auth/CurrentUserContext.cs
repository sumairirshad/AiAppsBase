using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Infrastructure.Auth;

public class CurrentUserContext : ICurrentUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ProcurementDbContext _db;

    private List<RoleAssignmentInfo>? _roleAssignments;
    private HashSet<string>? _permissionCodes;
    private long? _departmentId;

    public CurrentUserContext(IHttpContextAccessor httpContextAccessor, ProcurementDbContext db)
    {
        _httpContextAccessor = httpContextAccessor;
        _db = db;
    }

    public long UserId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (claim == null || !long.TryParse(claim, out var id))
            {
                throw new AuthenticationException("No authenticated user on the current request.");
            }
            return id;
        }
    }

    public async Task<long> GetDepartmentIdAsync()
    {
        if (_departmentId == null)
        {
            _departmentId = (await _db.Users.FirstAsync(u => u.Id == UserId)).DepartmentId;
        }
        return _departmentId.Value;
    }

    public async Task<IReadOnlyList<RoleAssignmentInfo>> GetRoleAssignmentsAsync()
    {
        if (_roleAssignments == null)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var rows = await (
                from a in _db.UserRoleAssignments
                join r in _db.Roles on a.RoleId equals r.Id
                where a.UserId == UserId && a.ValidFrom <= today && (a.ValidTo == null || a.ValidTo >= today)
                select new { r.Code, a.DepartmentId, a.LocationId }
            ).ToListAsync();

            _roleAssignments = rows.Select(r => new RoleAssignmentInfo(r.Code, r.DepartmentId, r.LocationId)).ToList();
        }
        return _roleAssignments;
    }

    public async Task<bool> HasRoleAsync(string roleCode)
    {
        var assignments = await GetRoleAssignmentsAsync();
        return assignments.Any(a => a.RoleCode == roleCode);
    }

    public async Task<bool> HasRoleForDepartmentAsync(string roleCode, long departmentId)
    {
        var assignments = await GetRoleAssignmentsAsync();
        return assignments.Any(a => a.RoleCode == roleCode && (a.DepartmentId == null || a.DepartmentId == departmentId));
    }

    public async Task<IReadOnlyList<long>> GetAccessibleDepartmentIdsAsync()
    {
        var ownDeptId = await GetDepartmentIdAsync();
        var accessRows = await _db.UserDepartmentAccess
            .Where(a => a.UserId == UserId && a.CanRaisePr)
            .Select(a => a.DepartmentId)
            .ToListAsync();
        return accessRows.Append(ownDeptId).Distinct().ToList();
    }

    public async Task<bool> HasPermissionAsync(string permissionCode)
    {
        if (_permissionCodes == null)
        {
            var assignments = await GetRoleAssignmentsAsync();
            var roleCodes = assignments.Select(a => a.RoleCode).Distinct().ToList();
            var codes = await (
                from rp in _db.RolePermissions
                join r in _db.Roles on rp.RoleId equals r.Id
                join p in _db.Permissions on rp.PermissionId equals p.Id
                where roleCodes.Contains(r.Code)
                select p.Code
            ).Distinct().ToListAsync();
            _permissionCodes = codes.ToHashSet();
        }
        return _permissionCodes.Contains(permissionCode);
    }
}
