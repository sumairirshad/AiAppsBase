namespace Procurement.Domain.Entities;

public class AuditQueries : AuditableEntity
{
    public short EntityTypeId { get; set; }
    public long EntityId { get; set; }
    public long RaisedBy { get; set; }
    public Users RaisedByUser { get; set; } = default!;
    public long AssignedRoleId { get; set; }
    public Roles AssignedRole { get; set; } = default!;
    public long? AssignedUserId { get; set; }
    public Users? AssignedUser { get; set; }
    public string QueryText { get; set; } = default!;
    public string? ResponseText { get; set; }
    public short QueryStatusId { get; set; }
    public DateTime? RespondedAt { get; set; }
}

public class AuditEvents : Entity
{
    public DateTime OccurredAt { get; set; }
    public long? ActorUserId { get; set; }
    public Users? ActorUser { get; set; }
    public long? ActorRoleId { get; set; }
    public Roles? ActorRole { get; set; }
    public string Action { get; set; } = default!;
    public short EntityTypeId { get; set; }
    public long? EntityId { get; set; }
    public string Outcome { get; set; } = default!;
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public Guid CorrelationId { get; set; }
    public string? IpAddress { get; set; }
}

public class AuditStamps : Entity
{
    public long PrId { get; set; }
    public PurchaseRequisitions Pr { get; set; } = default!;
    public bool PaymentVerified { get; set; }
    public bool DeliveryVerified { get; set; }
    public long StampedBy { get; set; }
    public Users StampedByUser { get; set; } = default!;
    public DateTime StampedAt { get; set; }
    public string? Remarks { get; set; }
}

public class MonthEndAudits : AuditableEntity
{
    public string Period { get; set; } = default!;
    public short StatusId { get; set; }
    public long StartedBy { get; set; }
    public Users StartedByUser { get; set; } = default!;
    public long? CompletedBy { get; set; }
    public Users? CompletedByUser { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Summary { get; set; }

    public ICollection<MonthEndAuditItems> Items { get; set; } = new List<MonthEndAuditItems>();
}

public class MonthEndAuditItems : Entity
{
    public long MonthEndAuditId { get; set; }
    public MonthEndAudits MonthEndAudit { get; set; } = default!;
    public long PrId { get; set; }
    public PurchaseRequisitions Pr { get; set; } = default!;
    public long? BillId { get; set; }
    public SupplierInvoices? Bill { get; set; }
    public bool WasPreAudited { get; set; }
    public string? Finding { get; set; }
}
