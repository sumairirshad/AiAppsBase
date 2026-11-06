namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class RecurringPlans : AuditableEntity
{
    public long Id { get; set; }
    public string PlanNo { get; set; } = string.Empty;
    public short RecurringPlanTypeId { get; set; }
    public long SpendSubHeadId { get; set; }
    public long DepartmentId { get; set; }
    public long LocationId { get; set; }
    public long OwnerUserId { get; set; }
    public short FrequencyId { get; set; }
    public byte GenerationDay { get; set; }
    public int DueOffsetDays { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int CurrentVersionNo { get; set; }
    public short StatusId { get; set; }
    public DateOnly? NextRunDate { get; set; }
    public long? VendorId { get; set; }
    public decimal? FixedAmount { get; set; }
    public long? ApprovedBy { get; set; }
}
