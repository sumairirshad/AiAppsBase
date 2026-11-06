namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class VendorRegistrationRequests : AuditableEntity
{
    public long Id { get; set; }
    public string RequestNo { get; set; } = string.Empty;
    public string ProposedData { get; set; } = string.Empty;
    public long ProposedByUserId { get; set; }
    public long SourceRoleId { get; set; }
    public short StatusId { get; set; }
    public long? ProcurementDecisionBy { get; set; }
    public string? ProcurementReason { get; set; }
    public long? CreatedVendorId { get; set; }
    public long? ProcurementHodDecisionBy { get; set; }
    public string? ProcurementHodReason { get; set; }
    public DateTime? RequesterNotifiedAt { get; set; }
}
