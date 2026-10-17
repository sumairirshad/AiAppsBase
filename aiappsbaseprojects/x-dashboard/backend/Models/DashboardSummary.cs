namespace XDashboard.Api.Models;

public class DashboardSummary
{
    public string Handle { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string ProfilePictureUrl { get; set; } = string.Empty;
    public bool HasVerifiedBadge { get; set; }
    public int TotalPosts { get; set; }
    public int TotalShorts { get; set; }
    public int ScheduledCount { get; set; }
    public int TotalLikes { get; set; }
    public int TotalViews { get; set; }
    public int TotalReposts { get; set; }
    public List<Post> RecentPosts { get; set; } = new();
    public List<ScheduledPost> UpcomingScheduled { get; set; } = new();
    public List<EngagementPoint> EngagementOverTime { get; set; } = new();
}

public class EngagementPoint
{
    public string Date { get; set; } = string.Empty;
    public int Likes { get; set; }
    public int Reposts { get; set; }
    public int Views { get; set; }
}
