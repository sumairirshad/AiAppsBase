using Instagram.Api.Data;
using Instagram.Api.Entities;
using Instagram.Api.Models.Dtos;
using Instagram.Api.Models.Requests;
using Microsoft.EntityFrameworkCore;

namespace Instagram.Api.Services;

public class PublishingJobService(InstagramDbContext db, IPublishingOrchestrator orchestrator)
    : IPublishingJobService
{
    public async Task<PublishingJobDto> CreateAsync(CreatePublishingJobRequest request, CancellationToken ct)
    {
        var accountExists = await db.ConnectedAccounts
            .AnyAsync(a => a.Id == request.ConnectedAccountId && a.IsActive, ct);
        if (!accountExists)
        {
            throw new KeyNotFoundException($"Active connected account {request.ConnectedAccountId} was not found.");
        }

        var now = DateTimeOffset.UtcNow;
        var job = new PublishingJob
        {
            Id = Guid.NewGuid(),
            ConnectedAccountId = request.ConnectedAccountId,
            ContentType = request.ContentType,
            Caption = request.Caption,
            Hashtags = request.Hashtags,
            ScheduledAt = request.ScheduledAt,
            Status = PublishingJobStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now
        };

        for (var i = 0; i < request.MediaAssets.Count; i++)
        {
            job.MediaAssets.Add(new MediaAsset
            {
                Id = Guid.NewGuid(),
                Url = request.MediaAssets[i].Url,
                MediaKind = request.MediaAssets[i].MediaKind,
                SortOrder = i
            });
        }

        db.PublishingJobs.Add(job);
        await db.SaveChangesAsync(ct);

        if (request.ScheduledAt is null)
        {
            await orchestrator.ExecuteAsync(job.Id, ct);
        }

        return await LoadDtoAsync(job.Id, ct);
    }

    public async Task<IReadOnlyList<PublishingJobDto>> GetJobsAsync(
        Guid? connectedAccountId, PublishingJobStatus? status, CancellationToken ct)
    {
        var query = db.PublishingJobs.Include(j => j.MediaAssets).AsNoTracking().AsQueryable();

        if (connectedAccountId is not null)
            query = query.Where(j => j.ConnectedAccountId == connectedAccountId);
        if (status is not null)
            query = query.Where(j => j.Status == status);

        var jobs = await query.OrderByDescending(j => j.CreatedAt).ToListAsync(ct);
        return jobs.Select(ToDto).ToList();
    }

    public async Task<PublishingJobDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        var job = await db.PublishingJobs.Include(j => j.MediaAssets)
            .AsNoTracking().FirstOrDefaultAsync(j => j.Id == id, ct);
        return job is null ? null : ToDto(job);
    }

    public async Task<PublishingJobDto> RetryAsync(Guid id, CancellationToken ct)
    {
        var job = await db.PublishingJobs.FirstOrDefaultAsync(j => j.Id == id, ct)
            ?? throw new KeyNotFoundException($"Publishing job {id} was not found.");

        if (job.Status != PublishingJobStatus.Failed)
        {
            throw new InvalidOperationException("Only failed jobs can be retried.");
        }

        job.Status = PublishingJobStatus.Pending;
        job.ErrorMessage = null;
        job.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        await orchestrator.ExecuteAsync(job.Id, ct);
        return await LoadDtoAsync(job.Id, ct);
    }

    private async Task<PublishingJobDto> LoadDtoAsync(Guid id, CancellationToken ct)
    {
        var job = await db.PublishingJobs.Include(j => j.MediaAssets)
            .AsNoTracking().FirstAsync(j => j.Id == id, ct);
        return ToDto(job);
    }

    private static PublishingJobDto ToDto(PublishingJob j) => new(
        j.Id, j.ConnectedAccountId, j.ContentType, j.Caption, j.Hashtags, j.Status,
        j.PlatformMediaId, j.ErrorMessage, j.AttemptCount, j.ScheduledAt, j.PublishedAt, j.CreatedAt,
        j.MediaAssets.OrderBy(m => m.SortOrder)
            .Select(m => new MediaAssetDto(m.Id, m.Url, m.MediaKind, m.SortOrder)).ToList());
}
