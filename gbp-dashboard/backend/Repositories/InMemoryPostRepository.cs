using GbpDashboard.Api.Models;
using GbpDashboard.Api.Options;
using GbpDashboard.Api.Seed;
using Microsoft.Extensions.Options;

namespace GbpDashboard.Api.Repositories;

public class InMemoryPostRepository : IPostRepository
{
    private readonly MockDataSettings _mockDataSettings;
    private readonly List<Post> _posts = SeedData.CreatePosts();
    private readonly object _lock = new();

    public InMemoryPostRepository(IOptions<MockDataSettings> mockDataSettings)
    {
        _mockDataSettings = mockDataSettings.Value;
    }

    public async Task<List<Post>> GetAllAsync()
    {
        await SimulateLatencyAsync();

        lock (_lock)
        {
            return _posts.OrderByDescending(p => p.UpdatedAt).ToList();
        }
    }

    public Task<Post?> GetByIdAsync(string id)
    {
        lock (_lock)
        {
            return Task.FromResult(_posts.FirstOrDefault(p => p.Id == id));
        }
    }

    public Task<Post> CreateAsync(Post post)
    {
        lock (_lock)
        {
            post.Id = $"post-{Guid.NewGuid():N}";
            post.CreatedAt = DateTimeOffset.UtcNow;
            post.UpdatedAt = DateTimeOffset.UtcNow;
            _posts.Add(post);
            return Task.FromResult(post);
        }
    }

    public Task<Post?> UpdateAsync(string id, Post post)
    {
        lock (_lock)
        {
            var existingIndex = _posts.FindIndex(p => p.Id == id);
            if (existingIndex == -1)
            {
                return Task.FromResult<Post?>(null);
            }

            post.Id = id;
            post.CreatedAt = _posts[existingIndex].CreatedAt;
            post.UpdatedAt = DateTimeOffset.UtcNow;
            _posts[existingIndex] = post;
            return Task.FromResult<Post?>(post);
        }
    }

    public Task<bool> DeleteAsync(string id)
    {
        lock (_lock)
        {
            var removed = _posts.RemoveAll(p => p.Id == id);
            return Task.FromResult(removed > 0);
        }
    }

    private Task SimulateLatencyAsync()
    {
        return _mockDataSettings.SimulatedLatencyMs > 0
            ? Task.Delay(_mockDataSettings.SimulatedLatencyMs)
            : Task.CompletedTask;
    }
}
