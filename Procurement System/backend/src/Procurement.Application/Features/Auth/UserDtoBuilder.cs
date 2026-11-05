using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Auth;

internal static class UserDtoBuilder
{
    public static async Task<UserDto> BuildAsync(IProcurementDbContext db, Users user, CancellationToken ct)
    {
        var department = await db.Departments.FirstAsync(d => d.Id == user.DepartmentId, ct);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var assignments = await db.UserRoleAssignments
            .Where(a => a.UserId == user.Id && a.ValidFrom <= today && (a.ValidTo == null || a.ValidTo >= today))
            .ToListAsync(ct);

        var roleIds = assignments.Select(a => a.RoleId).Distinct().ToList();
        var roles = await db.Roles.Where(r => roleIds.Contains(r.Id)).ToDictionaryAsync(r => r.Id, ct);
        var deptIds = assignments.Where(a => a.DepartmentId != null).Select(a => a.DepartmentId!.Value).Distinct().ToList();
        var depts = await db.Departments.Where(d => deptIds.Contains(d.Id)).ToDictionaryAsync(d => d.Id, ct);

        var roleDtos = assignments.Select(a =>
        {
            var role = roles[a.RoleId];
            Departments? dept = a.DepartmentId != null && depts.TryGetValue(a.DepartmentId.Value, out var d) ? d : null;
            return new RoleAssignmentDto(role.Id, role.Code, role.Name, a.DepartmentId, dept?.Code, dept?.Name);
        }).ToList();

        var permissions = await (
            from rp in db.RolePermissions
            join p in db.Permissions on rp.PermissionId equals p.Id
            where roleIds.Contains(rp.RoleId)
            select p.Code
        ).Distinct().ToListAsync(ct);

        return new UserDto(
            user.Id, user.EmployeeNo, user.DisplayName, user.Email,
            department.Id, department.Code, department.Name,
            roleDtos, permissions);
    }
}
