using Instagram.Api.Clients;
using Instagram.Api.Data;
using Instagram.Api.Entities;
using Instagram.Api.Models.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Instagram.Api.Services;

public class InsightsService(
    InstagramDbContext db,
    IInstagramGraphClient graphClient,
    IAccountService accountService) : IInsightsService
{
    private static readonly string[] AccountMetrics = ["reach", "profile_views", "accounts_engaged"];
    private static readonly string[] MediaMetrics = ["reach", "likes", "comments", "saved", "shares"];

    public async Task<IReadOnlyList<MetricDto>> SyncAndGetAccountInsightsAsync(Guid accountId, CancellationToken ct)
    {
        var account = await db.ConnectedAccounts.AsNoTracking().FirstOrDefaultAsync(a => a.Id == accountId, ct)
            ?? throw new KeyNotFoundException($"Connected account {accountId} was not found.");

        var accessToken = await accountService.GetDecryptedAccessTokenAsync(accountId, ct);
        var response = await graphClient.GetAccountInsightsAsync(account.PlatformUserId, accessToken, AccountMetrics, "day", ct);

        var now = DateTimeOffset.UtcNow;
        var snapshots = response.Data.Select(metric => new InsightsSnapshot
        {
            Id = Guid.NewGuid(),
            ConnectedAccountId = accountId,
            MetricName = metric.Name,
            MetricValue = metric.TotalValue?.Value ?? metric.Values?.LastOrDefault()?.Value ?? 0,
            CapturedAt = now
        }).ToList();

        db.InsightsSnapshots.AddRange(snapshots);
        await db.SaveChangesAsync(ct);

        return snapshots.Select(s => new MetricDto(s.MetricName, s.MetricValue, s.CapturedAt)).ToList();
    }

    public async Task<IReadOnlyList<MetricDto>> GetMediaInsightsAsync(Guid accountId, string mediaId, CancellationToken ct)
    {
        var accessToken = await accountService.GetDecryptedAccessTokenAsync(accountId, ct);
        var response = await graphClient.GetMediaInsightsAsync(mediaId, accessToken, MediaMetrics, ct);
        var now = DateTimeOffset.UtcNow;

        return response.Data
            .Select(metric => new MetricDto(metric.Name, metric.Values?.LastOrDefault()?.Value ?? 0, now))
            .ToList();
    }
}
