using TikTok.Api.Models.TikTok;

namespace TikTok.Api.Clients;

public interface ITikTokApiClient
{
    Task<TikTokTokenResponse> ExchangeCodeForTokenAsync(string code, string codeVerifier, CancellationToken ct);
    Task<TikTokTokenResponse> RefreshTokenAsync(string refreshToken, CancellationToken ct);
    Task<TikTokUser> GetUserInfoAsync(string accessToken, CancellationToken ct);
    Task<PublishInitResponse> InitVideoPublishAsync(string accessToken, VideoPublishInitRequest request, CancellationToken ct);
    Task<PublishInitResponse> InitPhotoPublishAsync(string accessToken, PhotoPublishInitRequest request, CancellationToken ct);
    Task<PublishStatusResponse> FetchPublishStatusAsync(string accessToken, string publishId, CancellationToken ct);
    Task<VideoListEnvelope> ListVideosAsync(string accessToken, int maxCount, long? cursor, CancellationToken ct);
}
