using XDashboard.Api.Models;
using XDashboard.Api.Services.Real;
using XDashboard.Api.Services.X;
using XDashboard.Api.Tests.Fakes;

namespace XDashboard.Api.Tests;

/// <summary>
/// Exercises RealDashboardService's aggregation math (grouping posts by day, summing
/// engagement, picking the account-wide tweet count over the fetched page count) against
/// hand-written fakes, with no network access.
/// </summary>
public class RealDashboardServiceTests
{
    private static (RealDashboardService Service, FakeXApiClient XApiClient, FakePostStore PostStore, FakeShortStore ShortStore, FakeSchedulerStore SchedulerStore, FakePremiumStatusProvider PremiumProvider) Build()
    {
        var xApiClient = new FakeXApiClient();
        var postStore = new FakePostStore();
        var shortStore = new FakeShortStore();
        var schedulerStore = new FakeSchedulerStore();
        var premiumProvider = new FakePremiumStatusProvider();

        var service = new RealDashboardService(xApiClient, postStore, shortStore, schedulerStore, premiumProvider);
        return (service, xApiClient, postStore, shortStore, schedulerStore, premiumProvider);
    }

    [Fact]
    public async Task GetSummaryAsync_UsesAccountWideTweetCountFromX_NotJustFetchedPageCount()
    {
        var (service, xApiClient, postStore, _, _, _) = Build();
        xApiClient.Me = new XUser
        {
            Username = "novaonx",
            Name = "Nova",
            PublicMetrics = new XUserPublicMetrics { TweetCount = 500 },
        };
        postStore.Posts = new List<Post> { new() { Id = "1", CreatedAt = DateTimeOffset.UtcNow } };

        var summary = await service.GetSummaryAsync();

        Assert.Equal(500, summary.TotalPosts);
    }

    [Fact]
    public async Task GetSummaryAsync_SumsLikesRepostsAndViewsAcrossPosts()
    {
        var (service, _, postStore, shortStore, _, _) = Build();
        postStore.Posts = new List<Post>
        {
            new() { Id = "1", CreatedAt = DateTimeOffset.UtcNow, Likes = 10, Reposts = 2, Views = 100 },
            new() { Id = "2", CreatedAt = DateTimeOffset.UtcNow, Likes = 5, Reposts = 1, Views = 50 },
        };
        shortStore.Shorts = new List<Short> { new() { Id = "s1", Views = 25 } };

        var summary = await service.GetSummaryAsync();

        Assert.Equal(15, summary.TotalLikes);
        Assert.Equal(3, summary.TotalReposts);
        Assert.Equal(175, summary.TotalViews); // 100 + 50 (posts) + 25 (short)
    }

    [Fact]
    public async Task GetSummaryAsync_GroupsEngagementByCalendarDay()
    {
        var (service, _, postStore, _, _, _) = Build();
        var day1 = new DateTimeOffset(2026, 1, 1, 9, 0, 0, TimeSpan.Zero);
        var day1Later = new DateTimeOffset(2026, 1, 1, 18, 0, 0, TimeSpan.Zero);
        var day2 = new DateTimeOffset(2026, 1, 2, 9, 0, 0, TimeSpan.Zero);

        postStore.Posts = new List<Post>
        {
            new() { Id = "1", CreatedAt = day1, Likes = 10 },
            new() { Id = "2", CreatedAt = day1Later, Likes = 5 },
            new() { Id = "3", CreatedAt = day2, Likes = 7 },
        };

        var summary = await service.GetSummaryAsync();

        Assert.Equal(2, summary.EngagementOverTime.Count);
        Assert.Equal("2026-01-01", summary.EngagementOverTime[0].Date);
        Assert.Equal(15, summary.EngagementOverTime[0].Likes);
        Assert.Equal("2026-01-02", summary.EngagementOverTime[1].Date);
        Assert.Equal(7, summary.EngagementOverTime[1].Likes);
    }

    [Fact]
    public async Task GetSummaryAsync_OnlyCountsScheduledStatusInScheduledCountAndUpcoming()
    {
        var (service, _, _, _, schedulerStore, _) = Build();
        schedulerStore.ScheduledPosts = new List<ScheduledPost>
        {
            new() { Id = "a", Status = ScheduleStatus.Scheduled, ScheduledFor = DateTimeOffset.UtcNow.AddHours(1) },
            new() { Id = "b", Status = ScheduleStatus.Published, ScheduledFor = DateTimeOffset.UtcNow.AddHours(-1) },
            new() { Id = "c", Status = ScheduleStatus.Failed, ScheduledFor = DateTimeOffset.UtcNow.AddHours(-2) },
        };

        var summary = await service.GetSummaryAsync();

        Assert.Equal(1, summary.ScheduledCount);
        Assert.Single(summary.UpcomingScheduled);
        Assert.Equal("a", summary.UpcomingScheduled[0].Id);
    }

    [Fact]
    public async Task GetSummaryAsync_ReflectsVerifiedBadgeFromPremiumStatus()
    {
        var (service, _, _, _, _, premiumProvider) = Build();
        premiumProvider.Status = new PremiumStatus { HasVerifiedBadge = true, IsSubscribed = true, Tier = "Premium" };

        var summary = await service.GetSummaryAsync();

        Assert.True(summary.HasVerifiedBadge);
    }
}
