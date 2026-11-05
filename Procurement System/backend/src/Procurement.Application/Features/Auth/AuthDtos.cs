namespace Procurement.Application.Features.Auth;

public record RoleAssignmentDto(long RoleId, string RoleCode, string RoleName, long? DepartmentId, string? DepartmentCode, string? DepartmentName);

public record UserDto(
    long Id,
    string EmployeeNo,
    string DisplayName,
    string Email,
    long DepartmentId,
    string DepartmentCode,
    string DepartmentName,
    IReadOnlyList<RoleAssignmentDto> Roles,
    IReadOnlyList<string> Permissions);

public record LoginResult(string Token, UserDto User);
