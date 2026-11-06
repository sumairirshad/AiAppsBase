namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class AuditQueries : AuditableEntity
{
    public long Id { get; set; }
    public short EntityTypeId { get; set; }
    public long EntityId { get; set; }
    public long RaisedBy { get; set; }
    public long AssignedRoleId { get; set; }
    public long? AssignedUserId { get; set; }
    public string QueryText { get; set; } = string.Empty;
    public string? ResponseText { get; set; }
    public short QueryStatusId { get; set; }
    public DateTime? RespondedAt { get; set; }
}
