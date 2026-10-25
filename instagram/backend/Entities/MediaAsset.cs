namespace Instagram.Api.Entities;

public class MediaAsset
{
    public Guid Id { get; set; }
    public Guid PublishingJobId { get; set; }
    public PublishingJob? PublishingJob { get; set; }

    public required string Url { get; set; }
    public InstagramMediaKind MediaKind { get; set; }
    public int SortOrder { get; set; }
    public string? PlatformChildContainerId { get; set; }
}
