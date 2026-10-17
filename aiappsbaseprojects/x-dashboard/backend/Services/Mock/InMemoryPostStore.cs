using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Services.Mock;

public class InMemoryPostStore : IPostStore
{
    private readonly object _lock = new();
    private readonly List<Post> _posts;

    public InMemoryPostStore(SeedDataLoader seedDataLoader)
    {
        _posts = seedDataLoader.Load<List<Post>>("posts.json");
    }

    public Task<IReadOnlyList<Post>> GetPostsAsync(CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var ordered = _posts.OrderByDescending(p => p.CreatedAt).ToList();
            return Task.FromResult<IReadOnlyList<Post>>(ordered);
        }
    }

    public Task<Post?> GetPostByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            return Task.FromResult(_posts.FirstOrDefault(p => p.Id == id));
        }
    }

    public Task<Post> CreatePostAsync(CreatePostRequest request, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var post = new Post
            {
                Id = $"post-{Guid.NewGuid():N}"[..13],
                AuthorHandle = "novaOnX",
                Type = request.Type,
                Text = request.Text,
                ImageUrls = request.ImageUrls,
                CreatedAt = DateTimeOffset.UtcNow,
                Likes = 0,
                Reposts = 0,
                Replies = 0,
                Views = 0,
                IsPinned = false
            };
            _posts.Insert(0, post);
            return Task.FromResult(post);
        }
    }

    public Task<Post?> UpdatePostAsync(string id, UpdatePostRequest request, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var post = _posts.FirstOrDefault(p => p.Id == id);
            if (post is null)
            {
                return Task.FromResult<Post?>(null);
            }

            post.Text = request.Text;
            post.ImageUrls = request.ImageUrls;
            return Task.FromResult<Post?>(post);
        }
    }

    public Task<bool> DeletePostAsync(string id, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var post = _posts.FirstOrDefault(p => p.Id == id);
            if (post is null)
            {
                return Task.FromResult(false);
            }

            _posts.Remove(post);
            return Task.FromResult(true);
        }
    }

    public Task<Post?> SetPinnedAsync(string id, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var target = _posts.FirstOrDefault(p => p.Id == id);
            if (target is null)
            {
                return Task.FromResult<Post?>(null);
            }

            foreach (var post in _posts)
            {
                post.IsPinned = post.Id == id;
            }

            return Task.FromResult<Post?>(target);
        }
    }

    public Task<Post> AddPublishedPostAsync(PostType type, string text, List<string> imageUrls, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var post = new Post
            {
                Id = $"post-{Guid.NewGuid():N}"[..13],
                AuthorHandle = "novaOnX",
                Type = type,
                Text = text,
                ImageUrls = imageUrls,
                CreatedAt = DateTimeOffset.UtcNow,
                Likes = 0,
                Reposts = 0,
                Replies = 0,
                Views = 0,
                IsPinned = false
            };
            _posts.Insert(0, post);
            return Task.FromResult(post);
        }
    }
}
