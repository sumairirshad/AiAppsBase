namespace Procurement.Domain.Entities;

public class GoodsReceiptLines
{
    public long Id { get; set; }
    public long GrnId { get; set; }
    public long PoLineId { get; set; }
    public decimal DeliveredQty { get; set; }
    public decimal AcceptedQty { get; set; }
    public decimal RejectedQty { get; set; }
    public string? RejectReason { get; set; }
    public long? EvidenceDocumentId { get; set; }
}
