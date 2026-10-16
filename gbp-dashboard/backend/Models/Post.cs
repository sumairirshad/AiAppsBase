namespace GbpDashboard.Api.Models;

public enum PostType
{
    Update,
    Event,
    Offer
}

public enum PostStatus
{
    Draft,
    Scheduled,
    Published
}

public class Post
{
    public string Id { get; set; } = string.Empty;
    public PostType Type { get; set; } = PostType.Update;
    public PostStatus Status { get; set; } = PostStatus.Draft;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string ActionButtonLabel { get; set; } = string.Empty;
    public string ActionButtonUrl { get; set; } = string.Empty;
    public DateTimeOffset? EventStartAt { get; set; }
    public DateTimeOffset? EventEndAt { get; set; }
    public string OfferCode { get; set; } = string.Empty;
    public DateTimeOffset? OfferValidUntil { get; set; }
    public DateTimeOffset? ScheduledAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
