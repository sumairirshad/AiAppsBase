namespace Procurement.Domain.Entities;

public class Vendors : AuditableEntity
{
    public string VendorCode { get; set; } = default!;
    public string LegalName { get; set; } = default!;
    public string Ntn { get; set; } = default!;
    public string? Strn { get; set; }
    public short VendorStatusId { get; set; }
    public bool HasDeliveryHistory { get; set; }
    public string? BlacklistReason { get; set; }
    public byte[] RowVer { get; set; } = default!;
    public decimal? OnTimeScore { get; set; }
    public decimal? PriceScore { get; set; }
    public decimal? QualityScore { get; set; }
    public decimal? OverallScore { get; set; }
    public bool IsStarVendor { get; set; }
    public DateTime? ScoreUpdatedAt { get; set; }

    public ICollection<VendorCategories> VendorCategories { get; set; } = new List<VendorCategories>();
    public ICollection<VendorContacts> Contacts { get; set; } = new List<VendorContacts>();
    public ICollection<VendorBankAccounts> BankAccounts { get; set; } = new List<VendorBankAccounts>();
    public ICollection<VendorDocuments> VendorDocuments { get; set; } = new List<VendorDocuments>();
}

public class VendorCategories : Entity
{
    public long VendorId { get; set; }
    public Vendors Vendor { get; set; } = default!;
    public long CategoryId { get; set; }
    public Categories Category { get; set; } = default!;
}

public class VendorContacts : AuditableEntity
{
    public long VendorId { get; set; }
    public Vendors Vendor { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public bool IsPrimary { get; set; }
}

public class VendorBankAccounts : AuditableEntity
{
    public long VendorId { get; set; }
    public Vendors Vendor { get; set; } = default!;
    public string BankName { get; set; } = default!;
    public string AccountTitle { get; set; } = default!;
    public byte[] AccountNoEncrypted { get; set; } = default!;
    public string AccountNoMasked { get; set; } = default!;
    public bool TitleMatchesLegalName { get; set; }
    public long? ExceptionApprovedBy { get; set; }
    public Users? ExceptionApprovedByUser { get; set; }
    public bool IsActive { get; set; } = true;
}

public class VendorDocuments : AuditableEntity
{
    public long VendorId { get; set; }
    public Vendors Vendor { get; set; } = default!;
    public long DocumentId { get; set; }
    public Documents Document { get; set; } = default!;
    public DateOnly? ExpiryDate { get; set; }
}

public class VendorRegistrationRequests : AuditableEntity
{
    public string RequestNo { get; set; } = default!;
    public string ProposedData { get; set; } = default!;
    public long ProposedByUserId { get; set; }
    public Users ProposedByUser { get; set; } = default!;
    public long SourceRoleId { get; set; }
    public Roles SourceRole { get; set; } = default!;
    public short StatusId { get; set; }
    public long? ProcurementDecisionBy { get; set; }
    public Users? ProcurementDecisionByUser { get; set; }
    public string? ProcurementReason { get; set; }
    public long? CreatedVendorId { get; set; }
    public Vendors? CreatedVendor { get; set; }
    public long? ProcurementHodDecisionBy { get; set; }
    public Users? ProcurementHodDecisionByUser { get; set; }
    public string? ProcurementHodReason { get; set; }
    public DateTime? RequesterNotifiedAt { get; set; }
}
