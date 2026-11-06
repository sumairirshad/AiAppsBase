namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class ContractTemplates : AuditableEntity
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public short ContractTypeId { get; set; }
    public int Version { get; set; }
    public bool IsActive { get; set; } = true;
}
