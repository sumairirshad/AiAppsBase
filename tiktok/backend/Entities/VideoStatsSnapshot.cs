namespace TikTok.Api.Entities;

public class VideoStatsSnapshot
{
    public Guid Id { get; set; }
    public Guid ConnectedAccountId { get; set; }
    public ConnectedAccount? ConnectedAccount { get; set; }

    public string TikTokVideoId { get; set; } = string.Empty;
    public long ViewCount { get; set; }
    public long LikeCount { get; set; }
    public long CommentCount { get; set; }
    public long ShareCount { get; set; }
    public DateTimeOffset CapturedAt { get; set; }
}
