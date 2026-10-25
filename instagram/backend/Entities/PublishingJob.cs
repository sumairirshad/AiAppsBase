namespace Instagram.Api.Entities;

public class PublishingJob
{
    public Guid Id { get; set; }
    public Guid ConnectedAccountId { get; set; }
    public ConnectedAccount? ConnectedAccount { get; set; }

    public InstagramContentType ContentType { get; set; }
    public string? Caption { get; set; }
    public string? Hashtags { get; set; }
    public PublishingJobStatus Status { get; set; } = PublishingJobStatus.Draft;

    public string? PlatformContainerId { get; set; }
    public string? PlatformMediaId { get; set; }
    public string? ErrorMessage { get; set; }
    public int AttemptCount { get; set; }

    public DateTimeOffset? ScheduledAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<MediaAsset> MediaAssets { get; set; } = new List<MediaAsset>();
}
