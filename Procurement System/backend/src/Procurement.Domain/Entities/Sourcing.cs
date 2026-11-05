namespace Procurement.Domain.Entities;

public class Quotations : AuditableEntity
{
    public long PrId { get; set; }
    public PurchaseRequisitions Pr { get; set; } = default!;
    public long VendorId { get; set; }
    public Vendors Vendor { get; set; } = default!;
    public string QuotationNo { get; set; } = default!;
    public DateOnly QuotationDate { get; set; }
    public string CurrencyCode { get; set; } = "PKR";
    public decimal Total { get; set; }
    public DateOnly? ValidUntil { get; set; }
    public long DocumentId { get; set; }
    public Documents Document { get; set; } = default!;
    public long SourcingGroupId { get; set; }
    public SourcingGroups SourcingGroup { get; set; } = default!;
    public decimal TaxTotal { get; set; }
    public decimal ComparableTotal { get; set; }

    public ICollection<QuotationLines> Lines { get; set; } = new List<QuotationLines>();
}

public class QuotationLines : Entity
{
    public long QuotationId { get; set; }
    public Quotations Quotation { get; set; } = default!;
    public long PrLineId { get; set; }
    public PrLines PrLine { get; set; } = default!;
    public decimal Qty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public int? DeliveryDays { get; set; }
}

public class SourcingGroups : AuditableEntity
{
    public long PrId { get; set; }
    public PurchaseRequisitions Pr { get; set; } = default!;
    public int GroupNo { get; set; }
    public long? CategoryId { get; set; }
    public Categories? Category { get; set; }
    public decimal GroupAmount { get; set; }
    public byte RequiredQuotes { get; set; }
    public long QuotationRuleId { get; set; }
    public QuotationRules QuotationRule { get; set; } = default!;
    public long? RecommendedQuotationId { get; set; }
    public Quotations? RecommendedQuotation { get; set; }
    public long? SelectedQuotationId { get; set; }
    public Quotations? SelectedQuotation { get; set; }
    public string? SelectionJustification { get; set; }
    public long? SelectedBy { get; set; }
    public Users? SelectedByUser { get; set; }
    public long? OpdDecisionBy { get; set; }
    public Users? OpdDecisionByUser { get; set; }

    public ICollection<PrLines> Lines { get; set; } = new List<PrLines>();
    public ICollection<Quotations> Quotations { get; set; } = new List<Quotations>();
}

public class AiChecks : Entity
{
    public short CheckTypeId { get; set; }
    public short EntityTypeId { get; set; }
    public long EntityId { get; set; }
    public string Outcome { get; set; } = default!;
    public string ResultJson { get; set; } = default!;
    public DateTime CheckedAt { get; set; }
    public decimal? Confidence { get; set; }
    public string? Disposition { get; set; }
    public long? ReviewedBy { get; set; }
    public Users? ReviewedByUser { get; set; }
}
