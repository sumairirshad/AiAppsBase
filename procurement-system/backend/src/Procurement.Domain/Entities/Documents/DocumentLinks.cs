namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class DocumentLinks : AuditableEntity
{
    public long Id { get; set; }
    public long DocumentId { get; set; }
    public short EntityTypeId { get; set; }
    public long EntityId { get; set; }
}
