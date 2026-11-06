namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class Items : AuditableEntity
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public long CategoryId { get; set; }
    public long UnitId { get; set; }
    public bool IsActive { get; set; } = true;
}
