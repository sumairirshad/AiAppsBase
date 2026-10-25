using Instagram.Api.Entities;
using Instagram.Api.Models.Dtos;
using Instagram.Api.Models.Requests;

namespace Instagram.Api.Services;

public interface IPublishingJobService
{
    Task<PublishingJobDto> CreateAsync(CreatePublishingJobRequest request, CancellationToken ct);
    Task<IReadOnlyList<PublishingJobDto>> GetJobsAsync(Guid? connectedAccountId, PublishingJobStatus? status, CancellationToken ct);
    Task<PublishingJobDto?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<PublishingJobDto> RetryAsync(Guid id, CancellationToken ct);
}
