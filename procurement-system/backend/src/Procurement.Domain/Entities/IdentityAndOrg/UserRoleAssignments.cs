namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class UserRoleAssignments : AuditableEntity
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long RoleId { get; set; }
    public long? DepartmentId { get; set; }
    public long? LocationId { get; set; }
    public DateOnly ValidFrom { get; set; }
    public DateOnly? ValidTo { get; set; }
}
