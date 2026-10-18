using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;
using XDashboard.Api.Services.X;

namespace XDashboard.Api.Services.Real;

/// <summary>
/// Aggregates the dashboard summary from the real X API plus the app's own local scheduler
/// state (X has no scheduling API -- see SchedulerPublishingService). TotalPosts uses the
/// account-wide public_metrics.tweet_count from X; TotalShorts and EngagementOverTime are
/// computed only from the most recent page of posts the X API returns, since the API exposes
/// current cumulative per-post metrics, not a historical engagement time series or a separate
/// "shorts" count -- see README for this limitation.
/// </summary>
public class RealDashboardService : IDashboardService
{
    private readonly IXApiClient _xApiClient;
    private readonly IPostStore _postStore;
    private readonly IShortStore _shortStore;
    private readonly ISchedulerStore _schedulerStore;
    private readonly IPremiumStatusProvider _premiumStatusProvider;

    public RealDashboardService(
        IXApiClient xApiClient,
        IPostStore postStore,
        IShortStore shortStore,
        ISchedulerStore schedulerStore,
        IPremiumStatusProvider premiumStatusProvider)
    {
        _xApiClient = xApiClient;
        _postStore = postStore;
        _shortStore = shortStore;
        _schedulerStore = schedulerStore;
        _premiumStatusProvider = premiumStatusProvider;
    }

    public async Task<DashboardSummary> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var me = await _xApiClient.GetMeAsync(cancellationToken);
        var posts = await _postStore.GetPostsAsync(cancellationToken);
        var shorts = await _shortStore.GetShortsAsync(cancellationToken);
        var scheduled = await _schedulerStore.GetScheduledPostsAsync(cancellationToken);
        var premiumStatus = await _premiumStatusProvider.GetStatusAsync(cancellationToken);

        var upcoming = scheduled
            .Where(s => s.Status == ScheduleStatus.Scheduled)
            .OrderBy(s => s.ScheduledFor)
            .Take(5)
            .ToList();

        var engagementByDay = posts
            .GroupBy(p => p.CreatedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new EngagementPoint
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                Likes = g.Sum(p => p.Likes),
                Reposts = g.Sum(p => p.Reposts),
                Views = g.Sum(p => p.Views),
            })
            .ToList();

        return new DashboardSummary
        {
            Handle = me.Username,
            DisplayName = me.Name,
            ProfilePictureUrl = me.ProfileImageUrl ?? string.Empty,
            HasVerifiedBadge = premiumStatus.HasVerifiedBadge,
            TotalPosts = me.PublicMetrics?.TweetCount ?? posts.Count,
            TotalShorts = shorts.Count,
            ScheduledCount = scheduled.Count(s => s.Status == ScheduleStatus.Scheduled),
            TotalLikes = posts.Sum(p => p.Likes),
            TotalViews = posts.Sum(p => p.Views) + shorts.Sum(s => s.Views),
            TotalReposts = posts.Sum(p => p.Reposts),
            RecentPosts = posts.Take(5).ToList(),
            UpcomingScheduled = upcoming,
            EngagementOverTime = engagementByDay,
        };
    }
}
