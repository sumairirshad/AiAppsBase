using Microsoft.EntityFrameworkCore;
using TikTok.Api.Clients;
using TikTok.Api.Data;
using TikTok.Api.Entities;
using TikTok.Api.Models.Dtos;
using TikTok.Api.Models.TikTok;

namespace TikTok.Api.Services;

public class PublishingService : IPublishingService
{
    private readonly TikTokDbContext _db;
    private readonly ITikTokApiClient _client;
    private readonly IAccountConnectionService _accountService;
    private readonly ILogger<PublishingService> _logger;

    public PublishingService(
        TikTokDbContext db,
        ITikTokApiClient client,
        IAccountConnectionService accountService,
        ILogger<PublishingService> logger)
    {
        _db = db;
        _client = client;
        _accountService = accountService;
        _logger = logger;
    }

    public async Task<PublishingJobDto> CreateJobAsync(CreatePublishingJobRequest request, CancellationToken ct)
    {
        var account = await _db.ConnectedAccounts.FirstOrDefaultAsync(a => a.Id == request.ConnectedAccountId && a.IsActive, ct)
            ?? throw new InvalidOperationException("No active connected account was found for the supplied id.");

        if (request.ContentType == ContentType.PhotoPost && request.MediaUrls.Count < 1)
        {
            throw new InvalidOperationException("A photo post requires at least one image URL.");
        }

        var now = DateTimeOffset.UtcNow;
        var job = new PublishingJob
        {
            Id = Guid.NewGuid(),
            ConnectedAccountId = account.Id,
            ContentType = request.ContentType,
            Title = request.Title,
            Caption = request.Caption,
            Hashtags = request.Hashtags,
            RequestedVisibility = request.RequestedVisibility,
            RequestDirectPost = request.RequestDirectPost,
            Status = PublishStatus.Pending,
            ScheduledAt = request.ScheduledAt ?? now,
            CreatedAt = now,
            UpdatedAt = now
        };

        for (var i = 0; i < request.MediaUrls.Count; i++)
        {
            job.MediaAssets.Add(new MediaAsset
            {
                Id = Guid.NewGuid(),
                PublishingJobId = job.Id,
                MediaType = request.ContentType == ContentType.Video ? MediaAssetType.Video : MediaAssetType.Photo,
                SourceUrl = request.MediaUrls[i],
                Order = i,
                CreatedAt = now
            });
        }

        _db.PublishingJobs.Add(job);
        await _db.SaveChangesAsync(ct);

        return await GetJobAsync(job.Id, ct) ?? throw new InvalidOperationException("Failed to load the job that was just created.");
    }

    public async Task<IReadOnlyList<PublishingJobDto>> ListJobsAsync(CancellationToken ct)
    {
        var jobs = await _db.PublishingJobs
            .Include(j => j.MediaAssets)
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync(ct);

        return jobs.Select(ToDto).ToList();
    }

    public async Task<PublishingJobDto?> GetJobAsync(Guid jobId, CancellationToken ct)
    {
        var job = await _db.PublishingJobs.Include(j => j.MediaAssets).FirstOrDefaultAsync(j => j.Id == jobId, ct);
        return job is null ? null : ToDto(job);
    }

    public async Task<PublishingJobDto?> RetryAsync(Guid jobId, CancellationToken ct)
    {
        var job = await _db.PublishingJobs.Include(j => j.MediaAssets).FirstOrDefaultAsync(j => j.Id == jobId, ct);
        if (job is null || job.Status != PublishStatus.Failed)
        {
            return job is null ? null : ToDto(job);
        }

        job.Status = PublishStatus.Pending;
        job.ErrorMessage = null;
        job.ScheduledAt = DateTimeOffset.UtcNow;
        job.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);

        return ToDto(job);
    }

    public Task<List<PublishingJob>> GetJobsReadyToExecuteAsync(CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        return _db.PublishingJobs
            .Include(j => j.MediaAssets)
            .Include(j => j.ConnectedAccount)
            .Where(j => j.Status == PublishStatus.Pending && j.ScheduledAt <= now)
            .ToListAsync(ct);
    }

    public Task<List<PublishingJob>> GetJobsAwaitingStatusAsync(CancellationToken ct)
    {
        return _db.PublishingJobs
            .Include(j => j.ConnectedAccount)
            .Where(j => j.Status == PublishStatus.Processing)
            .ToListAsync(ct);
    }

    public async Task ExecuteJobAsync(Guid jobId, CancellationToken ct)
    {
        var job = await _db.PublishingJobs
            .Include(j => j.MediaAssets)
            .Include(j => j.ConnectedAccount)
            .FirstOrDefaultAsync(j => j.Id == jobId, ct);

        if (job is null || job.ConnectedAccount is null)
        {
            return;
        }

        try
        {
            var accessToken = await _accountService.GetValidAccessTokenAsync(job.ConnectedAccount, ct);
            var postMode = job.RequestDirectPost ? "DIRECT_POST" : "MEDIA_UPLOAD";
            var orderedAssets = job.MediaAssets.OrderBy(m => m.Order).ToList();

            PublishInitResponse initResponse;
            if (job.ContentType == ContentType.Video)
            {
                initResponse = await _client.InitVideoPublishAsync(accessToken, new VideoPublishInitRequest
                {
                    PostMode = postMode,
                    PostInfo = new PostInfo
                    {
                        Title = job.Title,
                        Description = BuildFullCaption(job),
                        PrivacyLevel = PrivacyLevelMapper.ToTikTokValue(job.RequestedVisibility),
                        VideoCoverTimestampMs = 1000
                    },
                    SourceInfo = new PullFromUrlSourceInfo
                    {
                        Source = "PULL_FROM_URL",
                        VideoUrl = orderedAssets[0].SourceUrl
                    }
                }, ct);
            }
            else
            {
                initResponse = await _client.InitPhotoPublishAsync(accessToken, new PhotoPublishInitRequest
                {
                    PostMode = postMode,
                    PostInfo = new PostInfo
                    {
                        Title = job.Title,
                        Description = BuildFullCaption(job),
                        PrivacyLevel = PrivacyLevelMapper.ToTikTokValue(job.RequestedVisibility)
                    },
                    SourceInfo = new PullFromUrlSourceInfo
                    {
                        Source = "PULL_FROM_URL",
                        PhotoCoverIndex = 0,
                        PhotoImages = orderedAssets.Select(a => a.SourceUrl).ToList()
                    }
                }, ct);
            }

            job.TikTokPublishId = initResponse.Data.PublishId;
            job.Status = PublishStatus.Processing;
            job.AttemptCount += 1;
            job.UpdatedAt = DateTimeOffset.UtcNow;
        }
        catch (Exception ex)
        {
            job.Status = PublishStatus.Failed;
            job.ErrorMessage = ex.Message;
            job.AttemptCount += 1;
            job.UpdatedAt = DateTimeOffset.UtcNow;
            _logger.LogError(ex, "Failed to initiate TikTok publish for job {JobId}.", job.Id);
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task PollStatusAsync(Guid jobId, CancellationToken ct)
    {
        var job = await _db.PublishingJobs
            .Include(j => j.ConnectedAccount)
            .FirstOrDefaultAsync(j => j.Id == jobId, ct);

        if (job is null || job.ConnectedAccount is null || string.IsNullOrEmpty(job.TikTokPublishId))
        {
            return;
        }

        try
        {
            var accessToken = await _accountService.GetValidAccessTokenAsync(job.ConnectedAccount, ct);
            var status = await _client.FetchPublishStatusAsync(accessToken, job.TikTokPublishId, ct);

            switch (status.Data.Status)
            {
                case "PUBLISH_COMPLETE":
                    var publicIds = status.Data.PublicAvailablePostIds;
                    job.Status = publicIds is { Count: > 0 } ? PublishStatus.PublishedDirect : PublishStatus.SentToInbox;
                    job.PublishedPostId = publicIds is { Count: > 0 } ? publicIds[0] : null;
                    job.PublishedAt = DateTimeOffset.UtcNow;
                    break;
                case "FAILED":
                    job.Status = PublishStatus.Failed;
                    job.ErrorMessage = status.Data.FailReason ?? "TikTok reported the publish attempt failed.";
                    break;
                default:
                    break;
            }

            job.UpdatedAt = DateTimeOffset.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to poll TikTok publish status for job {JobId}.", job.Id);
        }

        await _db.SaveChangesAsync(ct);
    }

    private static string BuildFullCaption(PublishingJob job)
    {
        return string.IsNullOrWhiteSpace(job.Hashtags) ? job.Caption : $"{job.Caption} {job.Hashtags}";
    }

    private static PublishingJobDto ToDto(PublishingJob job) => new(
        job.Id,
        job.ConnectedAccountId,
        job.ContentType.ToString(),
        job.Title,
        job.Caption,
        job.Hashtags,
        job.RequestedVisibility.ToString(),
        job.RequestDirectPost,
        job.Status.ToString(),
        job.TikTokPublishId,
        job.PublishedPostId,
        job.ErrorMessage,
        job.AttemptCount,
        job.ScheduledAt,
        job.PublishedAt,
        job.CreatedAt,
        job.MediaAssets.OrderBy(m => m.Order).Select(m => new MediaAssetDto(m.Id, m.MediaType.ToString(), m.SourceUrl, m.Order)).ToList()
    );
}
