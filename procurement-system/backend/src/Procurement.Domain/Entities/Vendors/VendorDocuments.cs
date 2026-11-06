namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class VendorDocuments : AuditableEntity
{
    public long Id { get; set; }
    public long VendorId { get; set; }
    public long DocumentId { get; set; }
    public DateOnly? ExpiryDate { get; set; }
}
