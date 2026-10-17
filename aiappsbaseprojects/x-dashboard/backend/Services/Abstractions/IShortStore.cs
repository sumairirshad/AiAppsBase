using XDashboard.Api.Models;

namespace XDashboard.Api.Services.Abstractions;

public interface IShortStore
{
    Task<IReadOnlyList<Short>> GetShortsAsync(CancellationToken cancellationToken = default);
    Task<Short?> GetShortByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<Short> CreateShortAsync(CreateShortRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteShortAsync(string id, CancellationToken cancellationToken = default);
}
