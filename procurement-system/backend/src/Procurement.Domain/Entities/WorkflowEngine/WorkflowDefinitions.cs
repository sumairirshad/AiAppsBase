namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class WorkflowDefinitions : AuditableEntity
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public short EntityTypeId { get; set; }
    public int Version { get; set; }
    public bool IsActive { get; set; } = true;
    public DateOnly ActiveFrom { get; set; }
    public DateOnly? ActiveTo { get; set; }
}
