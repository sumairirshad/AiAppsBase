namespace Procurement.Domain.Entities;

public class RolePermissions
{
    public long Id { get; set; }
    public long RoleId { get; set; }
    public long PermissionId { get; set; }
}
