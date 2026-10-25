namespace TikTok.Api.Entities;

public enum MediaAssetType
{
    Video,
    Photo
}

public class MediaAsset
{
    public Guid Id { get; set; }
    public Guid PublishingJobId { get; set; }
    public PublishingJob? PublishingJob { get; set; }

    public MediaAssetType MediaType { get; set; }
    public string SourceUrl { get; set; } = string.Empty;
    public int Order { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
