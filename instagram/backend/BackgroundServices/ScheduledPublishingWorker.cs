using Instagram.Api.Configuration;
using Instagram.Api.Data;
using Instagram.Api.Entities;
using Instagram.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Instagram.Api.BackgroundServices;

public class ScheduledPublishingWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<PublishingWorkerOptions> options,
    ILogger<ScheduledPublishingWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var pollInterval = TimeSpan.FromSeconds(options.Value.PollIntervalSeconds);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessDueJobsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Scheduled publishing worker iteration failed.");
            }

            await Task.Delay(pollInterval, stoppingToken);
        }
    }

    private async Task ProcessDueJobsAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InstagramDbContext>();
        var orchestrator = scope.ServiceProvider.GetRequiredService<IPublishingOrchestrator>();
        var maxAttempts = options.Value.MaxAttemptsPerJob;

        var now = DateTimeOffset.UtcNow;
        var dueJobIds = await db.PublishingJobs
            .Where(j => j.Status == PublishingJobStatus.Pending
                && j.ScheduledAt != null
                && j.ScheduledAt <= now
                && j.AttemptCount < maxAttempts)
            .Select(j => j.Id)
            .ToListAsync(ct);

        foreach (var jobId in dueJobIds)
        {
            logger.LogInformation("Publishing scheduled job {JobId}.", jobId);
            await orchestrator.ExecuteAsync(jobId, ct);
        }
    }
}
