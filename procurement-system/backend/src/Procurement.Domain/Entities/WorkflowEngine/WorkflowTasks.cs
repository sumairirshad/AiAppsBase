namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class WorkflowTasks : AuditableEntity
{
    public long Id { get; set; }
    public long InstanceId { get; set; }
    public long StageId { get; set; }
    public long AssignedRoleId { get; set; }
    public long? AssignedUserId { get; set; }
    public long? ScopeDepartmentId { get; set; }
    public short TaskStatusId { get; set; }
    public DateTime? DueAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? EscalatedAt { get; set; }
    public long? EscalatedToRoleId { get; set; }
}
