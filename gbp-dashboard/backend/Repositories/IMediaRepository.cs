using GbpDashboard.Api.Models;

namespace GbpDashboard.Api.Repositories;

public interface IMediaRepository
{
    Task<List<MediaItem>> GetAllAsync();
    Task<MediaItem> CreateAsync(MediaItem item);
    Task<bool> DeleteAsync(string id);
}
