namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class WorkflowInstances : AuditableEntity
{
    public long Id { get; set; }
    public long DefinitionId { get; set; }
    public short EntityTypeId { get; set; }
    public long EntityId { get; set; }
    public long? CurrentStageId { get; set; }
    public string Status { get; set; } = string.Empty;
    public long PolicyVersionId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public byte[] RowVer { get; set; } = System.Array.Empty<byte>();
}
