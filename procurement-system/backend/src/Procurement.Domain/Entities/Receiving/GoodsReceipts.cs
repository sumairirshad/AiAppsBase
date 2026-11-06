namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class GoodsReceipts : AuditableEntity
{
    public long Id { get; set; }
    public string GrnNumber { get; set; } = string.Empty;
    public long PoId { get; set; }
    public DateOnly ReceivedOn { get; set; }
    public string DeliveryNoteNo { get; set; } = string.Empty;
    public long ReceivedBy { get; set; }
    public bool IsLate { get; set; } = false;
    public long? DeliveryNoteDocumentId { get; set; }
    public bool? OnTime { get; set; }
    public byte? QualityRating { get; set; }
    public long? AcknowledgedBy { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public string? AckRemarks { get; set; }
    public string? AckStatus { get; set; }
    public string? DisputeReason { get; set; }
}
