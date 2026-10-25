using Microsoft.EntityFrameworkCore;
using TikTok.Api.Clients;
using TikTok.Api.Data;
using TikTok.Api.Entities;
using TikTok.Api.Models.Dtos;

namespace TikTok.Api.Services;

public class StatsService : IStatsService
{
    private readonly TikTokDbContext _db;
    private readonly ITikTokApiClient _client;
    private readonly IAccountConnectionService _accountService;

    public StatsService(TikTokDbContext db, ITikTokApiClient client, IAccountConnectionService accountService)
    {
        _db = db;
        _client = client;
        _accountService = accountService;
    }

    public async Task<IReadOnlyList<VideoStatDto>> RefreshAndGetStatsAsync(Guid accountId, CancellationToken ct)
    {
        var account = await _db.ConnectedAccounts.FirstOrDefaultAsync(a => a.Id == accountId && a.IsActive, ct)
            ?? throw new InvalidOperationException("No active connected account was found for the supplied id.");

        var accessToken = await _accountService.GetValidAccessTokenAsync(account, ct);
        var videos = await _client.ListVideosAsync(accessToken, 20, null, ct);

        var now = DateTimeOffset.UtcNow;
        var snapshots = videos.Data.Videos.Select(v => new VideoStatsSnapshot
        {
            Id = Guid.NewGuid(),
            ConnectedAccountId = account.Id,
            TikTokVideoId = v.Id,
            ViewCount = v.ViewCount,
            LikeCount = v.LikeCount,
            CommentCount = v.CommentCount,
            ShareCount = v.ShareCount,
            CapturedAt = now
        }).ToList();

        _db.VideoStatsSnapshots.AddRange(snapshots);
        await _db.SaveChangesAsync(ct);

        return videos.Data.Videos.Select(v => new VideoStatDto(
            v.Id, v.Title, v.ViewCount, v.LikeCount, v.CommentCount, v.ShareCount, now)).ToList();
    }
}
