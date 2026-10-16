using GbpDashboard.Api.Models;
using GbpDashboard.Api.Options;
using GbpDashboard.Api.Seed;
using Microsoft.Extensions.Options;

namespace GbpDashboard.Api.Repositories;

public class InMemoryMediaRepository : IMediaRepository
{
    private readonly MockDataSettings _mockDataSettings;
    private readonly List<MediaItem> _items = SeedData.CreateMediaItems();
    private readonly object _lock = new();

    public InMemoryMediaRepository(IOptions<MockDataSettings> mockDataSettings)
    {
        _mockDataSettings = mockDataSettings.Value;
    }

    public async Task<List<MediaItem>> GetAllAsync()
    {
        await SimulateLatencyAsync();

        lock (_lock)
        {
            return _items.OrderByDescending(m => m.UploadedAt).ToList();
        }
    }

    public Task<MediaItem> CreateAsync(MediaItem item)
    {
        lock (_lock)
        {
            item.Id = $"media-{Guid.NewGuid():N}";
            item.UploadedAt = DateTimeOffset.UtcNow;
            _items.Add(item);
            return Task.FromResult(item);
        }
    }

    public Task<bool> DeleteAsync(string id)
    {
        lock (_lock)
        {
            var removed = _items.RemoveAll(m => m.Id == id);
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
