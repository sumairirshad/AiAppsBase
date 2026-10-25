namespace TikTok.Api.Entities;

public class PublishingJob
{
    public Guid Id { get; set; }
    public Guid ConnectedAccountId { get; set; }
    public ConnectedAccount? ConnectedAccount { get; set; }

    public ContentType ContentType { get; set; }
    public string? Title { get; set; }
    public string Caption { get; set; } = string.Empty;
    public string? Hashtags { get; set; }
    public PostVisibility RequestedVisibility { get; set; } = PostVisibility.SelfOnly;
    public bool RequestDirectPost { get; set; } = true;

    public PublishStatus Status { get; set; } = PublishStatus.Draft;
    public string? TikTokPublishId { get; set; }
    public string? PublishedPostId { get; set; }
    public string? ErrorMessage { get; set; }
    public int AttemptCount { get; set; }

    public DateTimeOffset? ScheduledAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<MediaAsset> MediaAssets { get; set; } = new List<MediaAsset>();
}
