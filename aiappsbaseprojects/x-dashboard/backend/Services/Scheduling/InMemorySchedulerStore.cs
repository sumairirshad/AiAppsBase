using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Services.Scheduling;

/// <summary>
/// Scheduled-post bookkeeping. This is NOT a mock of X -- the X API has no post-scheduling
/// endpoint at all (see README), so "scheduling" is necessarily an app-level feature: this store
/// holds the user's intent, and SchedulerPublishingService calls the real X API to actually
/// publish each post once its time arrives. Held in-memory for the same reason as the rest of
/// this phase's state (see README); a production deployment should back this with a real
/// database so scheduled posts survive a restart.
/// </summary>
public class InMemorySchedulerStore : ISchedulerStore
{
    private readonly object _lock = new();
    private readonly List<ScheduledPost> _scheduledPosts = new();
    private readonly IPostStore _postStore;

    public InMemorySchedulerStore(IPostStore postStore)
    {
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
                MediaIds = request.MediaIds,
                ScheduledFor = request.ScheduledFor,
                Status = ScheduleStatus.Scheduled,
                PublishedPostId = null,
                CreatedAt = DateTimeOffset.UtcNow,
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
            scheduled.MediaIds = request.MediaIds;
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

        try
        {
            var published = await _postStore.AddPublishedPostAsync(scheduled.Type, scheduled.Text, scheduled.MediaIds, cancellationToken);
            lock (_lock)
            {
                scheduled.Status = ScheduleStatus.Published;
                scheduled.PublishedPostId = published.Id;
                scheduled.FailureReason = null;
                return scheduled;
            }
        }
        catch (Exception ex)
        {
            lock (_lock)
            {
                scheduled.Status = ScheduleStatus.Failed;
                scheduled.FailureReason = ex.Message;
                return scheduled;
            }
        }
    }

    /// <summary>Used by SchedulerPublishingService to find posts whose time has arrived.</summary>
    public IReadOnlyList<ScheduledPost> GetDuePosts(DateTimeOffset asOf)
    {
        lock (_lock)
        {
            return _scheduledPosts
                .Where(s => s.Status == ScheduleStatus.Scheduled && s.ScheduledFor <= asOf)
                .ToList();
        }
    }
}
