namespace Procurement.Domain.Entities;

using Procurement.Domain.Common;

public class Documents : AuditableEntity
{
    public long Id { get; set; }
    public string StorageKey { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string Sha256 { get; set; } = string.Empty;
    public short DocumentTypeId { get; set; }
    public string Classification { get; set; } = string.Empty;
    public int VersionNo { get; set; }
    public long? ReplacesDocumentId { get; set; }
}
