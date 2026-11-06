namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class PurchaseRequisitions : AuditableEntity
{
    public long Id { get; set; }
    public string PrNumber { get; set; } = string.Empty;
    public long RequesterId { get; set; }
    public long DepartmentId { get; set; }
    public long LocationId { get; set; }
    public long SpendSubHeadId { get; set; }
    public long? ProjectId { get; set; }
    public short CostTypeId { get; set; }
    public bool IsEmergency { get; set; } = false;
    public string? EmergencyJustification { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal EstimatedAmount { get; set; }
    public decimal? ApprovedAmount { get; set; }
    public decimal? FinalAmount { get; set; }
    public string CurrencyCode { get; set; } = string.Empty;
    public byte? RequiredQuotes { get; set; }
    public short PrStatusId { get; set; }
    public long? WorkflowInstanceId { get; set; }
    public long? PolicyVersionId { get; set; }
    public long? RecurringOccurrenceId { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public byte[] RowVer { get; set; } = System.Array.Empty<byte>();
    public bool RaisedOnBehalf { get; set; } = false;
    public decimal? TentativeVariancePct { get; set; }
}
