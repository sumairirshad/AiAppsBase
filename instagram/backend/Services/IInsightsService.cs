using Instagram.Api.Models.Dtos;

namespace Instagram.Api.Services;

public interface IInsightsService
{
    Task<IReadOnlyList<MetricDto>> SyncAndGetAccountInsightsAsync(Guid accountId, CancellationToken ct);
    Task<IReadOnlyList<MetricDto>> GetMediaInsightsAsync(Guid accountId, string mediaId, CancellationToken ct);
}
