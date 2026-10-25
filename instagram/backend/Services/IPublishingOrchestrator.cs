using Instagram.Api.Entities;

namespace Instagram.Api.Services;

public interface IPublishingOrchestrator
{
    Task ExecuteAsync(Guid jobId, CancellationToken ct);
}
