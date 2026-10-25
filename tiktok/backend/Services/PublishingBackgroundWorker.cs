namespace TikTok.Api.Services;

public class PublishingBackgroundWorker : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(30);
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PublishingBackgroundWorker> _logger;

    public PublishingBackgroundWorker(IServiceScopeFactory scopeFactory, ILogger<PublishingBackgroundWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunOnceAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Publishing background worker iteration failed.");
            }

            try
            {
                await Task.Delay(PollInterval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
            }
        }
    }

    private async Task RunOnceAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var publishingService = scope.ServiceProvider.GetRequiredService<IPublishingService>();

        var readyJobs = await publishingService.GetJobsReadyToExecuteAsync(ct);
        foreach (var job in readyJobs)
        {
            await publishingService.ExecuteJobAsync(job.Id, ct);
        }

        var processingJobs = await publishingService.GetJobsAwaitingStatusAsync(ct);
        foreach (var job in processingJobs)
        {
            await publishingService.PollStatusAsync(job.Id, ct);
        }
    }
}
