using TikTok.Api.Entities;
using TikTok.Api.Models.Dtos;

namespace TikTok.Api.Services;

public interface IPublishingService
{
    Task<PublishingJobDto> CreateJobAsync(CreatePublishingJobRequest request, CancellationToken ct);
    Task<IReadOnlyList<PublishingJobDto>> ListJobsAsync(CancellationToken ct);
    Task<PublishingJobDto?> GetJobAsync(Guid jobId, CancellationToken ct);
    Task<PublishingJobDto?> RetryAsync(Guid jobId, CancellationToken ct);
    Task<List<PublishingJob>> GetJobsReadyToExecuteAsync(CancellationToken ct);
    Task<List<PublishingJob>> GetJobsAwaitingStatusAsync(CancellationToken ct);
    Task ExecuteJobAsync(Guid jobId, CancellationToken ct);
    Task PollStatusAsync(Guid jobId, CancellationToken ct);
}
