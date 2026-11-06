namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class Contracts : AuditableEntity
{
    public long Id { get; set; }
    public long PoId { get; set; }
    public short ContractTypeId { get; set; }
    public string Terms { get; set; } = string.Empty;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public long? GeneratedDocumentId { get; set; }
    public long? SignedDocumentId { get; set; }
    public long? TemplateId { get; set; }
    public string GoverningLaw { get; set; } = string.Empty;
    public string? CountryOfOrigin { get; set; }
    public string? Incoterms { get; set; }
    public string? ChequeNo { get; set; }
    public string? ChequeBank { get; set; }
    public decimal? ChequeAmount { get; set; }
    public long? ChequeDocumentId { get; set; }
    public short? ChequeStatusId { get; set; }
}
