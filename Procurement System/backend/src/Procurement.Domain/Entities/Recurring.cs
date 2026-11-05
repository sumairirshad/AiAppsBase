namespace Procurement.Domain.Entities;

public class RecurringPlans : AuditableEntity
{
    public string PlanNo { get; set; } = default!;
    public short RecurringPlanTypeId { get; set; }
    public long SpendSubHeadId { get; set; }
    public SpendSubHeads SpendSubHead { get; set; } = default!;
    public long DepartmentId { get; set; }
    public Departments Department { get; set; } = default!;
    public long LocationId { get; set; }
    public Locations Location { get; set; } = default!;
    public long OwnerUserId { get; set; }
    public Users OwnerUser { get; set; } = default!;
    public short FrequencyId { get; set; }
    public byte GenerationDay { get; set; }
    public int DueOffsetDays { get; set; } = 10;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int CurrentVersionNo { get; set; } = 1;
    public short StatusId { get; set; }
    public DateOnly? NextRunDate { get; set; }
    public long? VendorId { get; set; }
    public Vendors? Vendor { get; set; }
    public decimal? FixedAmount { get; set; }
    public long? ApprovedBy { get; set; }
    public Users? ApprovedByUser { get; set; }

    public ICollection<RecurringPlanLines> Lines { get; set; } = new List<RecurringPlanLines>();
    public ICollection<RecurringOccurrences> Occurrences { get; set; } = new List<RecurringOccurrences>();
}

public class RecurringPlanLines : Entity
{
    public long PlanId { get; set; }
    public RecurringPlans Plan { get; set; } = default!;
    public long ItemId { get; set; }
    public Items Item { get; set; } = default!;
    public decimal Qty { get; set; }
    public long UnitId { get; set; }
    public Units Unit { get; set; } = default!;
    public decimal? AgreedPrice { get; set; }
}

public class RecurringOccurrences : Entity
{
    public long PlanId { get; set; }
    public RecurringPlans Plan { get; set; } = default!;
    public int PlanVersionNo { get; set; }
    public string OccurrenceKey { get; set; } = default!;
    public DateOnly ScheduledFor { get; set; }
    public short OccurrenceStatusId { get; set; }
    public long? GeneratedPrId { get; set; }
    public PurchaseRequisitions? GeneratedPr { get; set; }
    public DateTime? GeneratedAt { get; set; }
    public string? Error { get; set; }
}
