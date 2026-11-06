namespace Procurement.Domain.Entities;

public class SpendSubHeads
{
    public long Id { get; set; }
    public long SpendHeadId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public short ProcurementModeId { get; set; }
    public bool AllowsTentative { get; set; } = false;
    public long WorkflowDefinitionId { get; set; }
}
