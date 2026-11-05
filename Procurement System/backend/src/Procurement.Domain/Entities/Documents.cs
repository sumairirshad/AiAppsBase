namespace Procurement.Domain.Entities;

public class Documents : AuditableEntity
{
    public string StorageKey { get; set; } = default!;
    public string FileName { get; set; } = default!;
    public string ContentType { get; set; } = default!;
    public long SizeBytes { get; set; }
    public string Sha256 { get; set; } = default!;
    public short DocumentTypeId { get; set; }
    public string Classification { get; set; } = "Internal";
    public int VersionNo { get; set; } = 1;
    public long? ReplacesDocumentId { get; set; }
    public Documents? ReplacesDocument { get; set; }
}

public class DocumentLinks : AuditableEntity
{
    public long DocumentId { get; set; }
    public Documents Document { get; set; } = default!;
    public short EntityTypeId { get; set; }
    public long EntityId { get; set; }
}
