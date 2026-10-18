using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Tests.Fakes;

public class FakePostStore : IPostStore
{
    public List<Post> Posts { get; set; } = new();

    public Task<IReadOnlyList<Post>> GetPostsAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<Post>>(Posts);

    public Task<Post?> GetPostByIdAsync(string id, CancellationToken cancellationToken = default) =>
        Task.FromResult(Posts.FirstOrDefault(p => p.Id == id));

    public Task<Post> CreatePostAsync(CreatePostRequest request, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<Post?> UpdatePostAsync(string id, UpdatePostRequest request, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<bool> DeletePostAsync(string id, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<Post?> SetPinnedAsync(string id, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<Post> AddPublishedPostAsync(PostType type, string text, List<string> mediaIds, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();
}

public class FakeShortStore : IShortStore
{
    public List<Short> Shorts { get; set; } = new();

    public Task<IReadOnlyList<Short>> GetShortsAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<Short>>(Shorts);

    public Task<Short?> GetShortByIdAsync(string id, CancellationToken cancellationToken = default) =>
        Task.FromResult(Shorts.FirstOrDefault(s => s.Id == id));

    public Task<Short> CreateShortAsync(CreateShortRequest request, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<bool> DeleteShortAsync(string id, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();
}

public class FakeSchedulerStore : ISchedulerStore
{
    public List<ScheduledPost> ScheduledPosts { get; set; } = new();

    public Task<IReadOnlyList<ScheduledPost>> GetScheduledPostsAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<ScheduledPost>>(ScheduledPosts);

    public Task<ScheduledPost?> GetScheduledPostByIdAsync(string id, CancellationToken cancellationToken = default) =>
        Task.FromResult(ScheduledPosts.FirstOrDefault(s => s.Id == id));

    public Task<ScheduledPost> CreateScheduledPostAsync(CreateScheduledPostRequest request, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<ScheduledPost?> UpdateScheduledPostAsync(string id, UpdateScheduledPostRequest request, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<bool> CancelScheduledPostAsync(string id, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public Task<ScheduledPost?> PublishNowAsync(string id, CancellationToken cancellationToken = default) =>
        throw new NotImplementedException();

    public IReadOnlyList<ScheduledPost> GetDuePosts(DateTimeOffset asOf) =>
        throw new NotImplementedException();
}

public class FakePremiumStatusProvider : IPremiumStatusProvider
{
    public PremiumStatus Status { get; set; } = new();

    public Task<PremiumStatus> GetStatusAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(Status);
}
