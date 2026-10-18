namespace XDashboard.Api.Models;

public class ScheduledPost
{
    public string Id { get; set; } = string.Empty;
    public PostType Type { get; set; } = PostType.Text;
    public string Text { get; set; } = string.Empty;

    /// <summary>Media ids, already uploaded to X via POST /api/media, to attach when this
    /// scheduled post is published. The X API has no native scheduling endpoint (see README);
    /// publishing is done by SchedulerPublishingService calling POST /2/tweets at the right
    /// time, so any media referenced here must already exist on X before ScheduledFor arrives.</summary>
    public List<string> MediaIds { get; set; } = new();

    public DateTimeOffset ScheduledFor { get; set; }
    public ScheduleStatus Status { get; set; } = ScheduleStatus.Scheduled;
    public string? PublishedPostId { get; set; }
    public string? FailureReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class CreateScheduledPostRequest
{
    public PostType Type { get; set; } = PostType.Text;
    public string Text { get; set; } = string.Empty;
    public List<string> MediaIds { get; set; } = new();
    public DateTimeOffset ScheduledFor { get; set; }
}

public class UpdateScheduledPostRequest
{
    public string Text { get; set; } = string.Empty;
    public List<string> MediaIds { get; set; } = new();
    public DateTimeOffset ScheduledFor { get; set; }
}
