namespace Tisoro.LinkedIn.Api.Models;

/// <summary>
/// A file uploaded through this app for use in a post. Stored on local disk
/// (see MediaStorageOptions) until a post using it is published, at which
/// point it is pushed to LinkedIn's Images/Videos/Documents upload API and
/// the resulting asset URN is cached here so a re-publish doesn't re-upload it.
/// </summary>
public sealed class MediaAsset
{
    public Guid Id { get; set; }
    public MediaKind Kind { get; set; }
    public string OriginalFileName { get; set; } = "";
    public string ContentType { get; set; } = "";
    public long SizeBytes { get; set; }
    public string StoragePath { get; set; } = "";
    public string? LinkedInAssetUrn { get; set; }
    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<PostMedia> PostMedia { get; set; } = new List<PostMedia>();
}
