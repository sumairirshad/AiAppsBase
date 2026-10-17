namespace XDashboard.Api.Models;

public class ScheduledPost
{
    public string Id { get; set; } = string.Empty;
    public PostType Type { get; set; } = PostType.Text;
    public string Text { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
    public DateTimeOffset ScheduledFor { get; set; }
    public ScheduleStatus Status { get; set; } = ScheduleStatus.Scheduled;
    public string? PublishedPostId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class CreateScheduledPostRequest
{
    public PostType Type { get; set; } = PostType.Text;
    public string Text { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
    public DateTimeOffset ScheduledFor { get; set; }
}

public class UpdateScheduledPostRequest
{
    public string Text { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
    public DateTimeOffset ScheduledFor { get; set; }
}
