namespace Procurement.Domain.Entities;

public class PurchaseRequisitions : AuditableEntity
{
    public string PrNumber { get; set; } = default!;
    public long RequesterId { get; set; }
    public Users Requester { get; set; } = default!;
    public long DepartmentId { get; set; }
    public Departments Department { get; set; } = default!;
    public long LocationId { get; set; }
    public Locations Location { get; set; } = default!;
    public long SpendSubHeadId { get; set; }
    public SpendSubHeads SpendSubHead { get; set; } = default!;
    public long? ProjectId { get; set; }
    public Projects? Project { get; set; }
    public short CostTypeId { get; set; }
    public bool IsEmergency { get; set; }
    public string? EmergencyJustification { get; set; }
    public string Title { get; set; } = default!;
    public decimal EstimatedAmount { get; set; }
    public decimal? ApprovedAmount { get; set; }
    public decimal? FinalAmount { get; set; }
    public string CurrencyCode { get; set; } = "PKR";
    public byte? RequiredQuotes { get; set; }
    public short PrStatusId { get; set; }
    public long? WorkflowInstanceId { get; set; }
    public WorkflowInstances? WorkflowInstance { get; set; }
    public long? PolicyVersionId { get; set; }
    public PolicyVersions? PolicyVersion { get; set; }
    public long? RecurringOccurrenceId { get; set; }
    public RecurringOccurrences? RecurringOccurrence { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public byte[] RowVer { get; set; } = default!;
    public bool RaisedOnBehalf { get; set; }
    public decimal? TentativeVariancePct { get; set; }

    public ICollection<PrLines> Lines { get; set; } = new List<PrLines>();
    public ICollection<PrComments> Comments { get; set; } = new List<PrComments>();
    public PrBills? Bill { get; set; }
    public ICollection<PrBudgetChecks> BudgetChecks { get; set; } = new List<PrBudgetChecks>();
    public ICollection<SourcingGroups> SourcingGroups { get; set; } = new List<SourcingGroups>();
    public ICollection<PurchaseOrders> PurchaseOrders { get; set; } = new List<PurchaseOrders>();
}

public class PrLines : AuditableEntity
{
    public long PrId { get; set; }
    public PurchaseRequisitions Pr { get; set; } = default!;
    public int LineNo { get; set; }
    public long ItemId { get; set; }
    public Items Item { get; set; } = default!;
    public string? Description { get; set; }
    public decimal Qty { get; set; }
    public long UnitId { get; set; }
    public Units Unit { get; set; } = default!;
    public decimal EstUnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public long? SuggestedVendorId { get; set; }
    public Vendors? SuggestedVendor { get; set; }
    public long? SourcingGroupId { get; set; }
    public SourcingGroups? SourcingGroup { get; set; }
    public long LocationId { get; set; }
    public Locations Location { get; set; } = default!;
    public decimal AcceptedQty { get; set; }
    public long? AwardedVendorId { get; set; }
    public Vendors? AwardedVendor { get; set; }
    public long? AwardedQuotationLineId { get; set; }
    public QuotationLines? AwardedQuotationLine { get; set; }
    public string? OverrideReason { get; set; }
}

public class PrBills : AuditableEntity
{
    public long PrId { get; set; }
    public PurchaseRequisitions Pr { get; set; } = default!;
    public string BillingPeriod { get; set; } = default!;
    public decimal BillAmount { get; set; }
    public string Purpose { get; set; } = default!;
    public DateOnly DueDate { get; set; }
    public long BillDocumentId { get; set; }
    public Documents BillDocument { get; set; } = default!;
}

public class PrComments : AuditableEntity
{
    public long PrId { get; set; }
    public PurchaseRequisitions Pr { get; set; } = default!;
    public short CommentTypeId { get; set; }
    public long AuthorUserId { get; set; }
    public Users AuthorUser { get; set; } = default!;
    public string Body { get; set; } = default!;
    public long? ParentCommentId { get; set; }
    public PrComments? ParentComment { get; set; }
}

public class PrBudgetChecks : AuditableEntity
{
    public long PrId { get; set; }
    public PurchaseRequisitions Pr { get; set; } = default!;
    public string BudgetRef { get; set; } = default!;
    public decimal? AvailableAmount { get; set; }
    public decimal PrAmount { get; set; }
    public decimal OverBudgetAmount { get; set; }
    public bool IsWithinBudget { get; set; }
    public string Source { get; set; } = default!;
    public long CheckedBy { get; set; }
    public Users CheckedByUser { get; set; } = default!;
    public DateTime CheckedAt { get; set; }
    public long? OpdDecisionBy { get; set; }
    public Users? OpdDecisionByUser { get; set; }
    public string? OpdReason { get; set; }
}
