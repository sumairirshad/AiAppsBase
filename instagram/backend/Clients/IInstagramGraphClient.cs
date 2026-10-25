namespace Instagram.Api.Clients;

public interface IInstagramGraphClient
{
    string BuildAuthorizationUrl(string state, string codeChallenge);
    Task<ShortLivedTokenResponse> ExchangeCodeForShortLivedTokenAsync(string code, CancellationToken ct);
    Task<LongLivedTokenResponse> ExchangeForLongLivedTokenAsync(string shortLivedAccessToken, CancellationToken ct);
    Task<LongLivedTokenResponse> RefreshLongLivedTokenAsync(string longLivedAccessToken, CancellationToken ct);
    Task<InstagramProfile> GetProfileAsync(string accessToken, CancellationToken ct);

    Task<MediaContainerResponse> CreateImageContainerAsync(
        string igUserId, string accessToken, string imageUrl, string? caption, bool isCarouselItem, CancellationToken ct);
    Task<MediaContainerResponse> CreateVideoContainerAsync(
        string igUserId, string accessToken, string videoUrl, string? caption, Entities.InstagramContentType contentType, bool isCarouselItem, CancellationToken ct);
    Task<MediaContainerResponse> CreateCarouselContainerAsync(
        string igUserId, string accessToken, IReadOnlyList<string> childContainerIds, string? caption, CancellationToken ct);
    Task<ContainerStatusResponse> GetContainerStatusAsync(string containerId, string accessToken, CancellationToken ct);
    Task<MediaPublishResponse> PublishContainerAsync(string igUserId, string accessToken, string creationId, CancellationToken ct);
    Task<PublishingLimitResponse> GetPublishingLimitAsync(string igUserId, string accessToken, CancellationToken ct);

    Task<InsightsResponse> GetMediaInsightsAsync(string mediaId, string accessToken, IReadOnlyList<string> metrics, CancellationToken ct);
    Task<InsightsResponse> GetAccountInsightsAsync(string igUserId, string accessToken, IReadOnlyList<string> metrics, string period, CancellationToken ct);

    Task<CommentsResponse> GetCommentsAsync(string mediaId, string accessToken, CancellationToken ct);
    Task<string> PostCommentReplyAsync(string commentId, string accessToken, string message, CancellationToken ct);
    Task SetCommentHiddenAsync(string commentId, string accessToken, bool hidden, CancellationToken ct);
    Task DeleteCommentAsync(string commentId, string accessToken, CancellationToken ct);
}
