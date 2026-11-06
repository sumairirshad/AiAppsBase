namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class VendorBankAccounts : AuditableEntity
{
    public long Id { get; set; }
    public long VendorId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string AccountTitle { get; set; } = string.Empty;
    public byte[] AccountNoEncrypted { get; set; } = System.Array.Empty<byte>();
    public string AccountNoMasked { get; set; } = string.Empty;
    public bool TitleMatchesLegalName { get; set; }
    public long? ExceptionApprovedBy { get; set; }
    public bool IsActive { get; set; } = true;
}
