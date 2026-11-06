namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class ItemRequests : AuditableEntity
{
    public long Id { get; set; }
    public string RequestType { get; set; } = string.Empty;
    public string ProposedName { get; set; } = string.Empty;
    public long? CategoryId { get; set; }
    public long RequestedBy { get; set; }
    public short StatusId { get; set; }
    public long? DecisionBy { get; set; }
    public string? DecisionReason { get; set; }
    public long? CreatedItemId { get; set; }
}
