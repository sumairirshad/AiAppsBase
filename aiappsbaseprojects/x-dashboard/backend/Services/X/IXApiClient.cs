namespace XDashboard.Api.Services.X;

public record TweetsPage(List<XTweet> Tweets, Dictionary<string, XMedia> MediaByKey, string? NextToken);

public record LegacyProfileFields(string? Name, string? Url, string? Location, string? Description);

/// <summary>
/// Authenticated access to the real X API v2 (and, for the handful of operations v2 does not
/// cover, the legacy v1.1 API) on behalf of the connected account. Every method here makes a
/// real HTTP call -- there is no mock/fallback path. Callers should expect <see cref="XApiException"/>
/// for API-level failures and <see cref="XNotConnectedException"/> when no account is connected.
/// </summary>
public interface IXApiClient
{
    Task<XUser> GetMeAsync(CancellationToken cancellationToken = default);

    Task<TweetsPage> GetUserTweetsAsync(string userId, string? paginationToken, int maxResults, CancellationToken cancellationToken = default);

    Task<(XTweet Tweet, Dictionary<string, XMedia> MediaByKey)?> GetTweetAsync(string tweetId, CancellationToken cancellationToken = default);

    Task<XCreatedTweetResponse> CreateTweetAsync(string? text, IReadOnlyList<string>? mediaIds, CancellationToken cancellationToken = default);

    Task DeleteTweetAsync(string tweetId, CancellationToken cancellationToken = default);

    Task PinTweetAsync(string userId, string tweetId, CancellationToken cancellationToken = default);

    Task UnpinTweetAsync(string userId, string tweetId, CancellationToken cancellationToken = default);

    /// <summary>Uploads image or video bytes via the chunked /2/media/upload flow (INIT, APPEND,
    /// FINALIZE, and STATUS polling for video), returning the resulting media id once X has
    /// finished processing it and it is safe to attach to a tweet.</summary>
    Task<string> UploadMediaAsync(byte[] content, string mimeType, string mediaCategory, CancellationToken cancellationToken = default);

    /// <summary>Legacy v1.1 endpoint; see README for current availability caveats. Only the
    /// fields passed as non-null are updated.</summary>
    Task<XUser> UpdateLegacyProfileAsync(LegacyProfileFields fields, CancellationToken cancellationToken = default);

    Task<string> UpdateProfileImageAsync(byte[] imageBytes, string mimeType, CancellationToken cancellationToken = default);

    Task<string> UpdateProfileBannerAsync(byte[] imageBytes, string mimeType, CancellationToken cancellationToken = default);
}
