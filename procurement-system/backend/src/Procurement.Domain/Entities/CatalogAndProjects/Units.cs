namespace Procurement.Domain.Entities;

public class Units
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public byte Precision { get; set; }
}
