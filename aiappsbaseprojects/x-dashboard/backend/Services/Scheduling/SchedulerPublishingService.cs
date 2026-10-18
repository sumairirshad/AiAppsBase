using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Services.Scheduling;

/// <summary>
/// The X API has no post-scheduling endpoint (confirmed against https://docs.x.com -- posts can
/// only be created for immediate publication). This background service is the legitimate
/// alternative: it polls for scheduled posts whose time has arrived and publishes each one
/// through the real X API at that moment, the same way a cron job hitting a "publish due posts"
/// script would. It requires this backend process to be running continuously; if the process is
/// down when a post's time arrives, that post publishes late, the next time the service ticks
/// after the process restarts. A production deployment that cannot guarantee a long-running
/// process should run the equivalent of this loop as an external scheduled job instead.
/// </summary>
public class SchedulerPublishingService : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(30);

    private readonly ISchedulerStore _schedulerStore;
    private readonly ILogger<SchedulerPublishingService> _logger;

    public SchedulerPublishingService(ISchedulerStore schedulerStore, ILogger<SchedulerPublishingService> logger)
    {
        _schedulerStore = schedulerStore;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await PublishDuePostsAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Scheduler publishing tick failed unexpectedly");
            }
        }
    }

    private async Task PublishDuePostsAsync(CancellationToken cancellationToken)
    {
        var due = _schedulerStore.GetDuePosts(DateTimeOffset.UtcNow);
        foreach (var scheduledPost in due)
        {
            var result = await _schedulerStore.PublishNowAsync(scheduledPost.Id, cancellationToken);
            if (result?.PublishedPostId is not null)
            {
                _logger.LogInformation(
                    "Published scheduled post {ScheduledId} as X post {PostId}",
                    scheduledPost.Id,
                    result.PublishedPostId);
            }
            else
            {
                _logger.LogWarning(
                    "Scheduled post {ScheduledId} failed to publish: {Reason}",
                    scheduledPost.Id,
                    result?.FailureReason ?? "unknown error");
            }
        }
    }
}
