namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class ApprovalBands : AuditableEntity
{
    public long Id { get; set; }
    public long PolicyVersionId { get; set; }
    public decimal MinAmount { get; set; }
    public decimal? MaxAmount { get; set; }
    public int Sequence { get; set; }
    public long RoleId { get; set; }
    public long? SpendSubHeadId { get; set; }
}
