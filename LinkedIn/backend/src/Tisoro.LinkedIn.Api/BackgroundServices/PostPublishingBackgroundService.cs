using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Tisoro.LinkedIn.Api.Configuration;
using Tisoro.LinkedIn.Api.Data;
using Tisoro.LinkedIn.Api.Models;
using Tisoro.LinkedIn.Api.Services;

namespace Tisoro.LinkedIn.Api.BackgroundServices;

/// <summary>
/// Polls for Scheduled posts whose time has come and publishes them. Runs in
/// its own DI scope per tick since AppDbContext is scoped, not singleton.
/// A post that fails is left as Failed (with PublishAttempts incremented) for
/// an admin to inspect and retry manually — this does not auto-retry, since a
/// hard failure (bad token, rejected content) retried blindly every tick would
/// just spam LinkedIn's API with the same doomed request.
/// </summary>
public sealed class PostPublishingBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly PublishingOptions _options;
    private readonly ILogger<PostPublishingBackgroundService> _logger;

    public PostPublishingBackgroundService(
        IServiceScopeFactory scopeFactory,
        IOptions<PublishingOptions> options,
        ILogger<PostPublishingBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromSeconds(Math.Max(5, _options.PollIntervalSeconds));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PublishDuePostsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Post publishing sweep failed");
            }

            try
            {
                await Task.Delay(interval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                // Shutting down.
            }
        }
    }

    private async Task PublishDuePostsAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var publisher = scope.ServiceProvider.GetRequiredService<IPostPublishingService>();

        var now = DateTimeOffset.UtcNow;
        var duePostIds = await db.Posts
            .Where(p => p.Status == PostStatus.Scheduled && p.ScheduledAt != null && p.ScheduledAt <= now)
            .OrderBy(p => p.ScheduledAt)
            .Select(p => p.Id)
            .ToListAsync(stoppingToken);

        foreach (var postId in duePostIds)
        {
            if (stoppingToken.IsCancellationRequested) break;

            var result = await publisher.PublishAsync(postId, stoppingToken);
            if (!result.Success)
            {
                _logger.LogWarning("Scheduled post {PostId} failed to publish: {Error}", postId, result.Error);
            }
        }
    }
}
