using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Services.Mock;

public class InMemorySchedulerStore : ISchedulerStore
{
    private readonly object _lock = new();
    private readonly List<ScheduledPost> _scheduledPosts;
    private readonly IPostStore _postStore;

    public InMemorySchedulerStore(SeedDataLoader seedDataLoader, IPostStore postStore)
    {
        _scheduledPosts = seedDataLoader.Load<List<ScheduledPost>>("scheduled-posts.json");
        _postStore = postStore;
    }

    public Task<IReadOnlyList<ScheduledPost>> GetScheduledPostsAsync(CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var ordered = _scheduledPosts.OrderBy(s => s.ScheduledFor).ToList();
            return Task.FromResult<IReadOnlyList<ScheduledPost>>(ordered);
        }
    }

    public Task<ScheduledPost?> GetScheduledPostByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            return Task.FromResult(_scheduledPosts.FirstOrDefault(s => s.Id == id));
        }
    }

    public Task<ScheduledPost> CreateScheduledPostAsync(CreateScheduledPostRequest request, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var scheduled = new ScheduledPost
            {
                Id = $"sched-{Guid.NewGuid():N}"[..14],
                Type = request.Type,
                Text = request.Text,
                ImageUrls = request.ImageUrls,
                ScheduledFor = request.ScheduledFor,
                Status = ScheduleStatus.Scheduled,
                PublishedPostId = null,
                CreatedAt = DateTimeOffset.UtcNow
            };
            _scheduledPosts.Add(scheduled);
            return Task.FromResult(scheduled);
        }
    }

    public Task<ScheduledPost?> UpdateScheduledPostAsync(string id, UpdateScheduledPostRequest request, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var scheduled = _scheduledPosts.FirstOrDefault(s => s.Id == id);
            if (scheduled is null || scheduled.Status != ScheduleStatus.Scheduled)
            {
                return Task.FromResult<ScheduledPost?>(null);
            }

            scheduled.Text = request.Text;
            scheduled.ImageUrls = request.ImageUrls;
            scheduled.ScheduledFor = request.ScheduledFor;
            return Task.FromResult<ScheduledPost?>(scheduled);
        }
    }

    public Task<bool> CancelScheduledPostAsync(string id, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var scheduled = _scheduledPosts.FirstOrDefault(s => s.Id == id);
            if (scheduled is null || scheduled.Status != ScheduleStatus.Scheduled)
            {
                return Task.FromResult(false);
            }

            _scheduledPosts.Remove(scheduled);
            return Task.FromResult(true);
        }
    }

    public async Task<ScheduledPost?> PublishNowAsync(string id, CancellationToken cancellationToken = default)
    {
        ScheduledPost? scheduled;
        lock (_lock)
        {
            scheduled = _scheduledPosts.FirstOrDefault(s => s.Id == id);
            if (scheduled is null || scheduled.Status != ScheduleStatus.Scheduled)
            {
                return null;
            }
        }

        var published = await _postStore.AddPublishedPostAsync(scheduled.Type, scheduled.Text, scheduled.ImageUrls, cancellationToken);

        lock (_lock)
        {
            scheduled.Status = ScheduleStatus.Published;
            scheduled.PublishedPostId = published.Id;
            return scheduled;
        }
    }
}
