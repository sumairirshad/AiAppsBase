namespace Procurement.Domain.Entities;

public class PurchaseOrders : AuditableEntity
{
    public string PoNumber { get; set; } = default!;
    public long PrId { get; set; }
    public PurchaseRequisitions Pr { get; set; } = default!;
    public long VendorId { get; set; }
    public Vendors Vendor { get; set; } = default!;
    public short PoTypeId { get; set; }
    public short PoStatusId { get; set; }
    public long? ReplacesPoId { get; set; }
    public PurchaseOrders? ReplacesPo { get; set; }
    public string CurrencyCode { get; set; } = "PKR";
    public decimal SubTotal { get; set; }
    public decimal TaxTotal { get; set; }
    public decimal Total { get; set; }
    public decimal? RetentionPct { get; set; }
    public DateOnly DeliveryDate { get; set; }
    public string? PaymentTerms { get; set; }
    public Guid IdempotencyKey { get; set; }
    public DateTime? IssuedAt { get; set; }
    public byte[] RowVer { get; set; } = default!;
    public string PoBaseNumber { get; set; } = default!;
    public char? PoSuffix { get; set; }
    public short AdvanceTypeId { get; set; }
    public decimal? AdvancePct { get; set; }
    public decimal? AdvanceAmount { get; set; }
    public decimal AdvancePaid { get; set; }
    public short? DispatchChannelId { get; set; }
    public DateTime? DispatchedAt { get; set; }

    public ICollection<PoLines> Lines { get; set; } = new List<PoLines>();
    public Contracts? Contract { get; set; }
    public ICollection<PoAmendments> Amendments { get; set; } = new List<PoAmendments>();
    public ICollection<GoodsReceipts> GoodsReceipts { get; set; } = new List<GoodsReceipts>();
}

public class PoLines : Entity
{
    public long PoId { get; set; }
    public PurchaseOrders Po { get; set; } = default!;
    public long PrLineId { get; set; }
    public PrLines PrLine { get; set; } = default!;
    public long? QuotationLineId { get; set; }
    public QuotationLines? QuotationLine { get; set; }
    public decimal Qty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public decimal AcceptedQty { get; set; }
    public decimal OutstandingQty { get; set; }
}

public class Contracts : AuditableEntity
{
    public long PoId { get; set; }
    public PurchaseOrders Po { get; set; } = default!;
    public short ContractTypeId { get; set; }
    public string Terms { get; set; } = default!;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public long? GeneratedDocumentId { get; set; }
    public Documents? GeneratedDocument { get; set; }
    public long? SignedDocumentId { get; set; }
    public Documents? SignedDocument { get; set; }
    public long? TemplateId { get; set; }
    public ContractTemplates? Template { get; set; }
    public string GoverningLaw { get; set; } = "Laws of Pakistan";
    public string? CountryOfOrigin { get; set; }
    public string? Incoterms { get; set; }
    public string? ChequeNo { get; set; }
    public string? ChequeBank { get; set; }
    public decimal? ChequeAmount { get; set; }
    public long? ChequeDocumentId { get; set; }
    public Documents? ChequeDocument { get; set; }
    public short? ChequeStatusId { get; set; }
}

public class PoAmendments : AuditableEntity
{
    public long PoId { get; set; }
    public PurchaseOrders Po { get; set; } = default!;
    public int AmendmentNo { get; set; }
    public short AmendmentTypeId { get; set; }
    public string OldValue { get; set; } = default!;
    public string NewValue { get; set; } = default!;
    public bool IsEscalation { get; set; }
    public string Reason { get; set; } = default!;
    public long? ApprovedBy { get; set; }
    public Users? ApprovedByUser { get; set; }
}

public class ContractTemplates : AuditableEntity
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public short ContractTypeId { get; set; }
    public int Version { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<ContractClauses> Clauses { get; set; } = new List<ContractClauses>();
}

public class ContractClauses : AuditableEntity
{
    public long TemplateId { get; set; }
    public ContractTemplates Template { get; set; } = default!;
    public short ClauseCategoryId { get; set; }
    public int Sequence { get; set; }
    public string Title { get; set; } = default!;
    public string Body { get; set; } = default!;
    public bool IsMandatory { get; set; } = true;
}
