namespace Procurement.Domain.Entities;

public class CostTypes
{
    public short Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public short SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
