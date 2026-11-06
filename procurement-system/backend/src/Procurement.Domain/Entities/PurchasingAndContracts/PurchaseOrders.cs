namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class PurchaseOrders : AuditableEntity
{
    public long Id { get; set; }
    public string PoNumber { get; set; } = string.Empty;
    public long PrId { get; set; }
    public long VendorId { get; set; }
    public short PoTypeId { get; set; }
    public short PoStatusId { get; set; }
    public long? ReplacesPoId { get; set; }
    public string CurrencyCode { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal Total { get; set; }
    public decimal? RetentionPct { get; set; }
    public DateOnly DeliveryDate { get; set; }
    public string? PaymentTerms { get; set; }
    public Guid IdempotencyKey { get; set; }
    public DateTime? IssuedAt { get; set; }
    public byte[] RowVer { get; set; } = System.Array.Empty<byte>();
    public string PoBaseNumber { get; set; } = string.Empty;
    public string? PoSuffix { get; set; }
    public short AdvanceTypeId { get; set; }
    public decimal? AdvancePct { get; set; }
    public decimal? AdvanceAmount { get; set; }
    public decimal AdvancePaid { get; set; }
    public short? DispatchChannelId { get; set; }
    public DateTime? DispatchedAt { get; set; }
}
