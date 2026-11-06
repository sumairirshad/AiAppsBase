namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class UserDepartmentAccess : AuditableEntity
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long DepartmentId { get; set; }
    public bool CanRaisePr { get; set; } = true;
}
