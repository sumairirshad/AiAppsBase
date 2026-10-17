using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Services.Mock;

public class DashboardService : IDashboardService
{
    private readonly IProfileStore _profileStore;
    private readonly IPostStore _postStore;
    private readonly IShortStore _shortStore;
    private readonly ISchedulerStore _schedulerStore;
    private readonly IPremiumStatusProvider _premiumStatusProvider;

    public DashboardService(
        IProfileStore profileStore,
        IPostStore postStore,
        IShortStore shortStore,
        ISchedulerStore schedulerStore,
        IPremiumStatusProvider premiumStatusProvider)
    {
        _profileStore = profileStore;
        _postStore = postStore;
        _shortStore = shortStore;
        _schedulerStore = schedulerStore;
        _premiumStatusProvider = premiumStatusProvider;
    }

    public async Task<DashboardSummary> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var profile = await _profileStore.GetProfileAsync(cancellationToken);
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
                Views = g.Sum(p => p.Views)
            })
            .ToList();

        return new DashboardSummary
        {
            Handle = profile.Handle,
            DisplayName = profile.DisplayName,
            ProfilePictureUrl = profile.ProfilePictureUrl,
            HasVerifiedBadge = premiumStatus.HasVerifiedBadge,
            TotalPosts = posts.Count,
            TotalShorts = shorts.Count,
            ScheduledCount = scheduled.Count(s => s.Status == ScheduleStatus.Scheduled),
            TotalLikes = posts.Sum(p => p.Likes),
            TotalViews = posts.Sum(p => p.Views) + shorts.Sum(s => s.Views),
            TotalReposts = posts.Sum(p => p.Reposts),
            RecentPosts = posts.Take(5).ToList(),
            UpcomingScheduled = upcoming,
            EngagementOverTime = engagementByDay
        };
    }
}
