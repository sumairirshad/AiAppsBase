using TikTok.Api.Models.Dtos;

namespace TikTok.Api.Services;

public interface IStatsService
{
    Task<IReadOnlyList<VideoStatDto>> RefreshAndGetStatsAsync(Guid accountId, CancellationToken ct);
}
