namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class VendorContacts : AuditableEntity
{
    public long Id { get; set; }
    public long VendorId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public bool IsPrimary { get; set; } = false;
}
