using XDashboard.Api.Services.X;

namespace XDashboard.Api.Tests.Fakes;

/// <summary>
/// A hand-written stand-in for IXApiClient so RealDashboardService's aggregation logic
/// (grouping, summing, picking fields) can be tested without any network access. Only GetMeAsync
/// is meaningful here -- that is the only method RealDashboardService calls directly; everything
/// else throws because the service under test never reaches it.
/// </summary>
public class FakeXApiClient : IXApiClient
{
    public XUser Me { get; set; } = new();

    /// <summary>When set, GetMeAsync throws this instead of returning <see cref="Me"/> -- lets a
    /// test simulate "not connected" or a real X API failure (rate limit, etc) reaching the
    /// controller/exception-middleware layer without any network access.</summary>
    public Exception? GetMeException { get; set; }

    public Task<XUser> GetMeAsync(CancellationToken cancellationToken = default) =>
        GetMeException is null ? Task.FromResult(Me) : Task.FromException<XUser>(GetMeException);

    public Task<TweetsPage> GetUserTweetsAsync(string userId, string? paginationToken, int maxResults, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task<(XTweet Tweet, Dictionary<string, XMedia> MediaByKey)?> GetTweetAsync(string tweetId, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task<XCreatedTweetResponse> CreateTweetAsync(string? text, IReadOnlyList<string>? mediaIds, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task DeleteTweetAsync(string tweetId, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task PinTweetAsync(string userId, string tweetId, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task UnpinTweetAsync(string userId, string tweetId, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task<string> UploadMediaAsync(byte[] content, string mimeType, string mediaCategory, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task<XUser> UpdateLegacyProfileAsync(LegacyProfileFields fields, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task<string> UpdateProfileImageAsync(byte[] imageBytes, string mimeType, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();

    public Task<string> UpdateProfileBannerAsync(byte[] imageBytes, string mimeType, CancellationToken cancellationToken = default)
        => throw new NotImplementedException();
}
