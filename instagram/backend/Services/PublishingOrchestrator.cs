using Instagram.Api.Clients;
using Instagram.Api.Configuration;
using Instagram.Api.Data;
using Instagram.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Instagram.Api.Services;

public class PublishingOrchestrator(
    InstagramDbContext db,
    IInstagramGraphClient graphClient,
    IAccountService accountService,
    IOptions<PublishingWorkerOptions> workerOptions,
    ILogger<PublishingOrchestrator> logger) : IPublishingOrchestrator
{
    public async Task ExecuteAsync(Guid jobId, CancellationToken ct)
    {
        var job = await db.PublishingJobs
            .Include(j => j.MediaAssets.OrderBy(m => m.SortOrder))
            .Include(j => j.ConnectedAccount)
            .FirstOrDefaultAsync(j => j.Id == jobId, ct)
            ?? throw new KeyNotFoundException($"Publishing job {jobId} was not found.");

        job.Status = PublishingJobStatus.Processing;
        job.AttemptCount += 1;
        job.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        try
        {
            var accessToken = await accountService.GetDecryptedAccessTokenAsync(job.ConnectedAccountId, ct);
            var igUserId = job.ConnectedAccount!.PlatformUserId;

            var creationId = job.ContentType switch
            {
                InstagramContentType.Image => await CreateSingleImageAsync(job, igUserId, accessToken, ct),
                InstagramContentType.Reels or InstagramContentType.Story =>
                    await CreateSingleVideoAsync(job, igUserId, accessToken, ct),
                InstagramContentType.Carousel => await CreateCarouselAsync(job, igUserId, accessToken, ct),
                _ => throw new InvalidOperationException($"Unsupported content type {job.ContentType}.")
            };

            await WaitForContainerReadyAsync(creationId, accessToken, ct);

            var published = await graphClient.PublishContainerAsync(igUserId, accessToken, creationId, ct);

            job.PlatformContainerId = creationId;
            job.PlatformMediaId = published.Id;
            job.Status = PublishingJobStatus.Published;
            job.PublishedAt = DateTimeOffset.UtcNow;
            job.ErrorMessage = null;
        }
        catch (Exception ex) when (ex is InstagramApiException or KeyNotFoundException)
        {
            job.Status = PublishingJobStatus.Failed;
            job.ErrorMessage = ex.Message;
            logger.LogError(ex, "Publishing job {JobId} failed.", job.Id);
        }

        job.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private async Task<string> CreateSingleImageAsync(PublishingJob job, string igUserId, string accessToken, CancellationToken ct)
    {
        var asset = job.MediaAssets.Single();
        var container = await graphClient.CreateImageContainerAsync(
            igUserId, accessToken, asset.Url, job.Caption, isCarouselItem: false, ct);
        return container.Id;
    }

    private async Task<string> CreateSingleVideoAsync(PublishingJob job, string igUserId, string accessToken, CancellationToken ct)
    {
        var asset = job.MediaAssets.Single();
        var container = await graphClient.CreateVideoContainerAsync(
            igUserId, accessToken, asset.Url, job.Caption, job.ContentType, isCarouselItem: false, ct);
        return container.Id;
    }

    private async Task<string> CreateCarouselAsync(PublishingJob job, string igUserId, string accessToken, CancellationToken ct)
    {
        var childIds = new List<string>();
        foreach (var asset in job.MediaAssets)
        {
            var childContainer = asset.MediaKind == InstagramMediaKind.Video
                ? await graphClient.CreateVideoContainerAsync(
                    igUserId, accessToken, asset.Url, caption: null, InstagramContentType.Image, isCarouselItem: true, ct)
                : await graphClient.CreateImageContainerAsync(
                    igUserId, accessToken, asset.Url, caption: null, isCarouselItem: true, ct);

            asset.PlatformChildContainerId = childContainer.Id;
            childIds.Add(childContainer.Id);
        }

        await db.SaveChangesAsync(ct);

        var carouselContainer = await graphClient.CreateCarouselContainerAsync(igUserId, accessToken, childIds, job.Caption, ct);
        return carouselContainer.Id;
    }

    private async Task WaitForContainerReadyAsync(string containerId, string accessToken, CancellationToken ct)
    {
        var options = workerOptions.Value;
        for (var attempt = 0; attempt < options.ContainerStatusMaxAttempts; attempt++)
        {
            var status = await graphClient.GetContainerStatusAsync(containerId, accessToken, ct);
            switch (status.StatusCode)
            {
                case "FINISHED":
                    return;
                case "ERROR":
                case "EXPIRED":
                    throw new InstagramApiException($"Media container {containerId} ended in status {status.StatusCode}.");
                default:
                    await Task.Delay(TimeSpan.FromSeconds(options.ContainerStatusPollIntervalSeconds), ct);
                    break;
            }
        }

        throw new InstagramApiException($"Media container {containerId} did not finish processing in time.");
    }
}
