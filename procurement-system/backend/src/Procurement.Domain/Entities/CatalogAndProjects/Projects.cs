namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class Projects : AuditableEntity
{
    public long Id { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public long OwnerDepartmentId { get; set; }
    public long? ManagerUserId { get; set; }
    public bool ContractProvided { get; set; } = false;
    public bool IsActive { get; set; } = true;
}
