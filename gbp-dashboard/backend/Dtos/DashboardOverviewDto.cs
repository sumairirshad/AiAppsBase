using GbpDashboard.Api.Models;

namespace GbpDashboard.Api.Dtos;

public class DashboardOverviewDto
{
    public BusinessProfile Profile { get; set; } = new();
    public int TotalPosts { get; set; }
    public int ScheduledPostsCount { get; set; }
    public int PublishedPostsCount { get; set; }
    public int DraftPostsCount { get; set; }
    public int MediaCount { get; set; }
    public List<Post> RecentPosts { get; set; } = new();
    public List<Post> UpcomingScheduledPosts { get; set; } = new();
}
