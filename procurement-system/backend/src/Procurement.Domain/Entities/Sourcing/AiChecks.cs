namespace Procurement.Domain.Entities;

public class AiChecks
{
    public long Id { get; set; }
    public short CheckTypeId { get; set; }
    public short EntityTypeId { get; set; }
    public long EntityId { get; set; }
    public string Outcome { get; set; } = string.Empty;
    public string? ResultJson { get; set; }
    public DateTime CheckedAt { get; set; }
    public decimal? Confidence { get; set; }
    public string? Disposition { get; set; }
    public long? ReviewedBy { get; set; }
}
