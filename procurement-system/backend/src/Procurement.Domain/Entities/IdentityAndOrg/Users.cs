namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class Users : AuditableEntity
{
    public long Id { get; set; }
    public string EmployeeNo { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public long DepartmentId { get; set; }
    public string? PasswordHash { get; set; }
    public bool IsActive { get; set; } = true;
}
