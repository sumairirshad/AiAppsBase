namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class PoAmendments : AuditableEntity
{
    public long Id { get; set; }
    public long PoId { get; set; }
    public int AmendmentNo { get; set; }
    public short AmendmentTypeId { get; set; }
    public string OldValue { get; set; } = string.Empty;
    public string NewValue { get; set; } = string.Empty;
    public bool IsEscalation { get; set; }
    public string Reason { get; set; } = string.Empty;
    public long? ApprovedBy { get; set; }
}
