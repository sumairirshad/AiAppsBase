namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class PolicySettings : AuditableEntity
{
    public long Id { get; set; }
    public long PolicyVersionId { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string ValueType { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
