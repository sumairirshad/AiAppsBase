namespace Procurement.Domain.Entities;

public class SpendHeads
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ApprovalMode { get; set; } = string.Empty;
}
