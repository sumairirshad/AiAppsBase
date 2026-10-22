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

    public Task<Post> CreatePostAsync(CreatePostRequest request, CancellationToken cancellationToken = default)
    {
        var post = new Post
        {
            Id = $"post-{Guid.NewGuid():N}"[..12],
            Type = request.Type,
            Text = request.Text,
            ImageUrls = request.MediaIds,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        Posts.Add(post);
        return Task.FromResult(post);
    }

    /// <summary>Mirrors RealPostStore: the X API has no endpoint to edit a published post.</summary>
    public Task<Post?> UpdatePostAsync(string id, UpdatePostRequest request, CancellationToken cancellationToken = default) =>
        throw new XDashboard.Api.Services.X.XFeatureNotSupportedException(
            "X does not support editing a published post's text or media. Delete this post and create a new one instead.");

    public Task<bool> DeletePostAsync(string id, CancellationToken cancellationToken = default)
    {
        var post = Posts.FirstOrDefault(p => p.Id == id);
        if (post is null)
        {
            return Task.FromResult(false);
        }

        Posts.Remove(post);
        return Task.FromResult(true);
    }

    public Task<Post?> SetPinnedAsync(string id, CancellationToken cancellationToken = default)
    {
        var post = Posts.FirstOrDefault(p => p.Id == id);
        if (post is null)
        {
            return Task.FromResult<Post?>(null);
        }

        foreach (var other in Posts.Where(p => p.Id != id))
        {
            other.IsPinned = false;
        }

        post.IsPinned = !post.IsPinned;
        return Task.FromResult<Post?>(post);
    }

    /// <summary>When set, AddPublishedPostAsync throws this instead of succeeding -- lets a test
    /// simulate a scheduled post whose publish attempt fails against the real X API.</summary>
    public Exception? AddPublishedPostException { get; set; }

    public Task<Post> AddPublishedPostAsync(PostType type, string text, List<string> mediaIds, CancellationToken cancellationToken = default)
    {
        if (AddPublishedPostException is not null)
        {
            return Task.FromException<Post>(AddPublishedPostException);
        }

        var post = new Post
        {
            Id = $"post-{Guid.NewGuid():N}"[..12],
            Type = type,
            Text = text,
            ImageUrls = mediaIds,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        Posts.Add(post);
        return Task.FromResult(post);
    }
}

public class FakeShortStore : IShortStore
{
    public List<Short> Shorts { get; set; } = new();

    public Task<IReadOnlyList<Short>> GetShortsAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<Short>>(Shorts);

    public Task<Short?> GetShortByIdAsync(string id, CancellationToken cancellationToken = default) =>
        Task.FromResult(Shorts.FirstOrDefault(s => s.Id == id));

    public Task<Short> CreateShortAsync(CreateShortRequest request, CancellationToken cancellationToken = default)
    {
        var created = new Short
        {
            Id = $"short-{Guid.NewGuid():N}"[..13],
            Caption = request.Caption,
            Description = request.Description,
            Hashtags = request.Hashtags,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        Shorts.Add(created);
        return Task.FromResult(created);
    }

    public Task<bool> DeleteShortAsync(string id, CancellationToken cancellationToken = default)
    {
        var found = Shorts.FirstOrDefault(s => s.Id == id);
        if (found is null)
        {
            return Task.FromResult(false);
        }

        Shorts.Remove(found);
        return Task.FromResult(true);
    }
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
