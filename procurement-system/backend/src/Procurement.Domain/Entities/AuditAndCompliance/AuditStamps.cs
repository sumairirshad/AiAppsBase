namespace Procurement.Domain.Entities;

public class AuditStamps
{
    public long Id { get; set; }
    public long PrId { get; set; }
    public bool PaymentVerified { get; set; }
    public bool DeliveryVerified { get; set; }
    public long StampedBy { get; set; }
    public DateTime StampedAt { get; set; }
    public string? Remarks { get; set; }
}
