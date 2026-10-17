using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Services.Mock;

public class InMemoryShortStore : IShortStore
{
    private readonly object _lock = new();
    private readonly List<Short> _shorts;

    public InMemoryShortStore(SeedDataLoader seedDataLoader)
    {
        _shorts = seedDataLoader.Load<List<Short>>("shorts.json");
    }

    public Task<IReadOnlyList<Short>> GetShortsAsync(CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var ordered = _shorts.OrderByDescending(s => s.CreatedAt).ToList();
            return Task.FromResult<IReadOnlyList<Short>>(ordered);
        }
    }

    public Task<Short?> GetShortByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            return Task.FromResult(_shorts.FirstOrDefault(s => s.Id == id));
        }
    }

    public Task<Short> CreateShortAsync(CreateShortRequest request, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var created = new Short
            {
                Id = $"short-{Guid.NewGuid():N}"[..14],
                VideoUrl = $"/mock-assets/shorts/uploads/{request.FileName}",
                ThumbnailUrl = "/mock-assets/shorts/default-thumb.svg",
                Caption = request.Caption,
                Description = request.Description,
                Hashtags = request.Hashtags,
                CreatedAt = DateTimeOffset.UtcNow,
                Views = 0,
                Likes = 0,
                Duration = TimeSpan.Zero
            };
            _shorts.Insert(0, created);
            return Task.FromResult(created);
        }
    }

    public Task<bool> DeleteShortAsync(string id, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var existing = _shorts.FirstOrDefault(s => s.Id == id);
            if (existing is null)
            {
                return Task.FromResult(false);
            }

            _shorts.Remove(existing);
            return Task.FromResult(true);
        }
    }
}
