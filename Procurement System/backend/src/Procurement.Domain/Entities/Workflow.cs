using Procurement.Domain.Constants;

namespace Procurement.Domain.Entities;

public class WorkflowDefinitions : AuditableEntity
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public short EntityTypeId { get; set; }
    public int Version { get; set; }
    public bool IsActive { get; set; } = true;
    public DateOnly ActiveFrom { get; set; }
    public DateOnly? ActiveTo { get; set; }

    public ICollection<WorkflowStages> Stages { get; set; } = new List<WorkflowStages>();
}

public class WorkflowStages : AuditableEntity
{
    public long DefinitionId { get; set; }
    public WorkflowDefinitions Definition { get; set; } = default!;
    public string StageCode { get; set; } = default!;
    public int Sequence { get; set; }
    public short StageTypeId { get; set; }
    public long? RoleId { get; set; }
    public Roles? Role { get; set; }
    public short? PrStatusId { get; set; }
    public string? ConditionExpr { get; set; }
    public bool IsOptional { get; set; }
    public int? EscalationDays { get; set; }
    public long? EscalateToRoleId { get; set; }
    public Roles? EscalateToRole { get; set; }
    public string ScopeType { get; set; } = WorkflowStageScopeTypes.None;
    public long? ScopeDepartmentId { get; set; }
    public Departments? ScopeDepartment { get; set; }
}

public class WorkflowInstances : AuditableEntity
{
    public long DefinitionId { get; set; }
    public WorkflowDefinitions Definition { get; set; } = default!;
    public short EntityTypeId { get; set; }
    public long EntityId { get; set; }
    public long? CurrentStageId { get; set; }
    public WorkflowStages? CurrentStage { get; set; }
    public string Status { get; set; } = "Running";
    public long PolicyVersionId { get; set; }
    public PolicyVersions PolicyVersion { get; set; } = default!;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public byte[] RowVer { get; set; } = default!;

    public ICollection<WorkflowTasks> Tasks { get; set; } = new List<WorkflowTasks>();
    public ICollection<WorkflowActions> Actions { get; set; } = new List<WorkflowActions>();
}

public class WorkflowTasks : AuditableEntity
{
    public long InstanceId { get; set; }
    public WorkflowInstances Instance { get; set; } = default!;
    public long StageId { get; set; }
    public WorkflowStages Stage { get; set; } = default!;
    public long AssignedRoleId { get; set; }
    public Roles AssignedRole { get; set; } = default!;
    public long? AssignedUserId { get; set; }
    public Users? AssignedUser { get; set; }
    public long? ScopeDepartmentId { get; set; }
    public Departments? ScopeDepartment { get; set; }
    public short TaskStatusId { get; set; }
    public DateTime? DueAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? EscalatedAt { get; set; }
    public long? EscalatedToRoleId { get; set; }
    public Roles? EscalatedToRole { get; set; }
}

public class WorkflowActions : Entity
{
    public long InstanceId { get; set; }
    public WorkflowInstances Instance { get; set; } = default!;
    public long? TaskId { get; set; }
    public WorkflowTasks? Task { get; set; }
    public short ActionTypeId { get; set; }
    public long ActorUserId { get; set; }
    public Users ActorUser { get; set; } = default!;
    public long ActorRoleId { get; set; }
    public Roles ActorRole { get; set; } = default!;
    public long? FromStageId { get; set; }
    public WorkflowStages? FromStage { get; set; }
    public long? ToStageId { get; set; }
    public WorkflowStages? ToStage { get; set; }
    public string? Remarks { get; set; }
    public long PolicyVersionId { get; set; }
    public PolicyVersions PolicyVersion { get; set; } = default!;
    public Guid CorrelationId { get; set; }
    public DateTime ActedAt { get; set; }
}
