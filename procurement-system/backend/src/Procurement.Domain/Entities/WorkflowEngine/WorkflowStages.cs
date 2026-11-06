namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class WorkflowStages : AuditableEntity
{
    public long Id { get; set; }
    public long DefinitionId { get; set; }
    public string StageCode { get; set; } = string.Empty;
    public int Sequence { get; set; }
    public short StageTypeId { get; set; }
    public long? RoleId { get; set; }
    public short? PrStatusId { get; set; }
    public string? ConditionExpr { get; set; }
    public bool IsOptional { get; set; } = false;
    public int? EscalationDays { get; set; }
    public long? EscalateToRoleId { get; set; }
    public string ScopeType { get; set; } = string.Empty;
    public long? ScopeDepartmentId { get; set; }
}
