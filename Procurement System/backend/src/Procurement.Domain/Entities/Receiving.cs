namespace Procurement.Domain.Entities;

public class GoodsReceipts : AuditableEntity
{
    public string GrnNumber { get; set; } = default!;
    public long PoId { get; set; }
    public PurchaseOrders Po { get; set; } = default!;
    public DateOnly ReceivedOn { get; set; }
    public string DeliveryNoteNo { get; set; } = default!;
    public long ReceivedBy { get; set; }
    public Users ReceivedByUser { get; set; } = default!;
    public bool IsLate { get; set; }
    public long? DeliveryNoteDocumentId { get; set; }
    public Documents? DeliveryNoteDocument { get; set; }
    public bool? OnTime { get; set; }
    public byte? QualityRating { get; set; }
    public long? AcknowledgedBy { get; set; }
    public Users? AcknowledgedByUser { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public string? AckRemarks { get; set; }
    public string? AckStatus { get; set; }
    public string? DisputeReason { get; set; }

    public ICollection<GoodsReceiptLines> Lines { get; set; } = new List<GoodsReceiptLines>();
}

public class GoodsReceiptLines : Entity
{
    public long GrnId { get; set; }
    public GoodsReceipts Grn { get; set; } = default!;
    public long PoLineId { get; set; }
    public PoLines PoLine { get; set; } = default!;
    public decimal DeliveredQty { get; set; }
    public decimal AcceptedQty { get; set; }
    public decimal RejectedQty { get; set; }
    public string? RejectReason { get; set; }
    public long? EvidenceDocumentId { get; set; }
    public Documents? EvidenceDocument { get; set; }
}
