namespace Procurement.Domain.Entities;

public class WorkflowActions
{
    public long Id { get; set; }
    public long InstanceId { get; set; }
    public long? TaskId { get; set; }
    public short ActionTypeId { get; set; }
    public long ActorUserId { get; set; }
    public long ActorRoleId { get; set; }
    public long? FromStageId { get; set; }
    public long? ToStageId { get; set; }
    public string? Remarks { get; set; }
    public long PolicyVersionId { get; set; }
    public Guid CorrelationId { get; set; }
    public DateTime ActedAt { get; set; }
}
