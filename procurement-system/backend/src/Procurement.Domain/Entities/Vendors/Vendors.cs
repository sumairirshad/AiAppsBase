namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class Vendors : AuditableEntity
{
    public long Id { get; set; }
    public string VendorCode { get; set; } = string.Empty;
    public string LegalName { get; set; } = string.Empty;
    public string Ntn { get; set; } = string.Empty;
    public string? Strn { get; set; }
    public short VendorStatusId { get; set; }
    public bool HasDeliveryHistory { get; set; } = false;
    public string? BlacklistReason { get; set; }
    public byte[] RowVer { get; set; } = System.Array.Empty<byte>();
    public decimal? OnTimeScore { get; set; }
    public decimal? PriceScore { get; set; }
    public decimal? QualityScore { get; set; }
    public decimal? OverallScore { get; set; }
    public bool IsStarVendor { get; set; } = false;
    public DateTime? ScoreUpdatedAt { get; set; }
}
