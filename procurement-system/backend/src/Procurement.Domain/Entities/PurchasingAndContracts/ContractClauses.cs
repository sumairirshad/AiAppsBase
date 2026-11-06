namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class ContractClauses : AuditableEntity
{
    public long Id { get; set; }
    public long TemplateId { get; set; }
    public short ClauseCategoryId { get; set; }
    public int Sequence { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsMandatory { get; set; } = true;
}
