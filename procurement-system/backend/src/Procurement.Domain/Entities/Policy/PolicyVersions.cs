namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class PolicyVersions : AuditableEntity
{
    public long Id { get; set; }
    public int VersionNo { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public short StatusId { get; set; }
    public long? ApprovedBy { get; set; }
    public string ChangeReason { get; set; } = string.Empty;
}
