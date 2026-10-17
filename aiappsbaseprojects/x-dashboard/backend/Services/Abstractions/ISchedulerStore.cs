using XDashboard.Api.Models;

namespace XDashboard.Api.Services.Abstractions;

public interface ISchedulerStore
{
    Task<IReadOnlyList<ScheduledPost>> GetScheduledPostsAsync(CancellationToken cancellationToken = default);
    Task<ScheduledPost?> GetScheduledPostByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<ScheduledPost> CreateScheduledPostAsync(CreateScheduledPostRequest request, CancellationToken cancellationToken = default);
    Task<ScheduledPost?> UpdateScheduledPostAsync(string id, UpdateScheduledPostRequest request, CancellationToken cancellationToken = default);
    Task<bool> CancelScheduledPostAsync(string id, CancellationToken cancellationToken = default);
    Task<ScheduledPost?> PublishNowAsync(string id, CancellationToken cancellationToken = default);
}
