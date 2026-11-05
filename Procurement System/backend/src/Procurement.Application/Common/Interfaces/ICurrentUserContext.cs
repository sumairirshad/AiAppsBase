namespace Procurement.Application.Common.Interfaces;

public record RoleAssignmentInfo(string RoleCode, long? DepartmentId, long? LocationId);

public interface ICurrentUserContext
{
    long UserId { get; }
    Task<long> GetDepartmentIdAsync();
    Task<IReadOnlyList<RoleAssignmentInfo>> GetRoleAssignmentsAsync();
    Task<bool> HasRoleAsync(string roleCode);
    Task<bool> HasRoleForDepartmentAsync(string roleCode, long departmentId);
    Task<IReadOnlyList<long>> GetAccessibleDepartmentIdsAsync();
    Task<bool> HasPermissionAsync(string permissionCode);
}
