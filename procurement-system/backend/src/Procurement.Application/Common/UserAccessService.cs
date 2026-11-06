using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Common;

public record RoleAssignment(long RoleId, string RoleCode, long? DepartmentId);

// The "Data scope" and "Task" layers of the four-layer authorization check (see the
// architecture spec): which roles a user holds, in which departments, and which departments/
// categories they may raise or see PRs for. Every module reads this instead of trusting the
// client for scope.
public class UserAccessService
{
    private readonly IApplicationDbContext _db;

    public UserAccessService(IApplicationDbContext db) => _db = db;

    public async Task<List<RoleAssignment>> GetAssignmentsAsync(long userId, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return await _db.UserRoleAssignments
            .Where(a => a.UserId == userId && a.ValidFrom <= today && (a.ValidTo == null || a.ValidTo >= today))
            .Join(_db.Roles, a => a.RoleId, r => r.Id, (a, r) => new RoleAssignment(r.Id, r.Code, a.DepartmentId))
            .ToListAsync(ct);
    }

    public async Task<bool> HasRoleAsync(long userId, string roleCode, long? departmentId, CancellationToken ct = default)
    {
        var assignments = await GetAssignmentsAsync(userId, ct);
        return assignments.Any(a => a.RoleCode.Equals(roleCode, StringComparison.OrdinalIgnoreCase) &&
                                     (departmentId == null || a.DepartmentId == null || a.DepartmentId == departmentId));
    }

    // BR-001..004: a PR's department must be in the user's access list (OPD exempt, since
    // OPD can raise a PR for any department) and each line's category must be mapped to that
    // department via DepartmentCategories.
    public async Task<bool> CanRaiseForDepartmentAsync(long userId, long departmentId, CancellationToken ct = default)
    {
        if (await HasRoleAsync(userId, "OPD", null, ct)) return true;
        return await _db.UserDepartmentAccess.AnyAsync(a => a.UserId == userId && a.DepartmentId == departmentId && a.CanRaisePr, ct);
    }

    public async Task<bool> IsCategoryAllowedForDepartmentAsync(long departmentId, long categoryId, CancellationToken ct = default) =>
        await _db.DepartmentCategories.AnyAsync(dc => dc.DepartmentId == departmentId && dc.CategoryId == categoryId, ct);

    // "Procurement HOD" = the HOD role scoped to the Procurement department.
    public async Task<long?> GetProcurementDepartmentIdAsync(CancellationToken ct = default) =>
        (await _db.Departments.FirstOrDefaultAsync(d => d.Code == "PROC", ct))?.Id;
}
