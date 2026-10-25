using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using TikTok.Api.Configuration;
using TikTok.Api.Models.TikTok;

namespace TikTok.Api.Clients;

public class TikTokApiClient : ITikTokApiClient
{
    private readonly HttpClient _httpClient;
    private readonly TikTokOptions _options;

    public TikTokApiClient(HttpClient httpClient, IOptions<TikTokOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<TikTokTokenResponse> ExchangeCodeForTokenAsync(string code, string codeVerifier, CancellationToken ct)
    {
        var form = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_key"] = _options.ClientKey,
            ["client_secret"] = _options.ClientSecret,
            ["code"] = code,
            ["grant_type"] = "authorization_code",
            ["redirect_uri"] = _options.RedirectUri,
            ["code_verifier"] = codeVerifier
        });

        using var response = await _httpClient.PostAsync(_options.TokenUrl, form, ct);
        var payload = await response.Content.ReadFromJsonAsync<TikTokTokenResponse>(cancellationToken: ct)
            ?? throw new TikTokApiException("TikTok token endpoint returned an empty response.");

        if (!response.IsSuccessStatusCode || !string.IsNullOrEmpty(payload.Error))
        {
            throw new TikTokApiException($"TikTok token exchange failed: {payload.ErrorDescription ?? payload.Error}", payload.Error);
        }

        return payload;
    }

    public async Task<TikTokTokenResponse> RefreshTokenAsync(string refreshToken, CancellationToken ct)
    {
        var form = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_key"] = _options.ClientKey,
            ["client_secret"] = _options.ClientSecret,
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = refreshToken
        });

        using var response = await _httpClient.PostAsync(_options.TokenUrl, form, ct);
        var payload = await response.Content.ReadFromJsonAsync<TikTokTokenResponse>(cancellationToken: ct)
            ?? throw new TikTokApiException("TikTok token endpoint returned an empty response.");

        if (!response.IsSuccessStatusCode || !string.IsNullOrEmpty(payload.Error))
        {
            throw new TikTokApiException($"TikTok token refresh failed: {payload.ErrorDescription ?? payload.Error}", payload.Error);
        }

        return payload;
    }

    public async Task<TikTokUser> GetUserInfoAsync(string accessToken, CancellationToken ct)
    {
        const string fields = "open_id,union_id,avatar_url,display_name,username,bio_description,is_verified,follower_count,following_count,likes_count,video_count";
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{_options.ApiBaseUrl}/v2/user/info/?fields={fields}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _httpClient.SendAsync(request, ct);
        var payload = await response.Content.ReadFromJsonAsync<TikTokUserInfoEnvelope>(cancellationToken: ct)
            ?? throw new TikTokApiException("TikTok user info endpoint returned an empty response.");

        ThrowIfError(payload.Error);
        return payload.Data.User;
    }

    public async Task<PublishInitResponse> InitVideoPublishAsync(string accessToken, VideoPublishInitRequest request, CancellationToken ct)
    {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{_options.ApiBaseUrl}/v2/post/publish/video/init/")
        {
            Content = JsonContent.Create(request)
        };
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _httpClient.SendAsync(httpRequest, ct);
        var payload = await response.Content.ReadFromJsonAsync<PublishInitResponse>(cancellationToken: ct)
            ?? throw new TikTokApiException("TikTok video publish init returned an empty response.");

        ThrowIfError(payload.Error);
        return payload;
    }

    public async Task<PublishInitResponse> InitPhotoPublishAsync(string accessToken, PhotoPublishInitRequest request, CancellationToken ct)
    {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{_options.ApiBaseUrl}/v2/post/publish/content/init/")
        {
            Content = JsonContent.Create(request)
        };
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _httpClient.SendAsync(httpRequest, ct);
        var payload = await response.Content.ReadFromJsonAsync<PublishInitResponse>(cancellationToken: ct)
            ?? throw new TikTokApiException("TikTok photo publish init returned an empty response.");

        ThrowIfError(payload.Error);
        return payload;
    }

    public async Task<PublishStatusResponse> FetchPublishStatusAsync(string accessToken, string publishId, CancellationToken ct)
    {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{_options.ApiBaseUrl}/v2/post/publish/status/fetch/")
        {
            Content = JsonContent.Create(new PublishStatusFetchRequest { PublishId = publishId })
        };
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _httpClient.SendAsync(httpRequest, ct);
        var payload = await response.Content.ReadFromJsonAsync<PublishStatusResponse>(cancellationToken: ct)
            ?? throw new TikTokApiException("TikTok publish status fetch returned an empty response.");

        ThrowIfError(payload.Error);
        return payload;
    }

    public async Task<VideoListEnvelope> ListVideosAsync(string accessToken, int maxCount, long? cursor, CancellationToken ct)
    {
        const string fields = "id,title,view_count,like_count,comment_count,share_count,create_time";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, $"{_options.ApiBaseUrl}/v2/video/list/?fields={fields}")
        {
            Content = JsonContent.Create(new VideoListRequest { MaxCount = maxCount, Cursor = cursor })
        };
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await _httpClient.SendAsync(httpRequest, ct);
        var payload = await response.Content.ReadFromJsonAsync<VideoListEnvelope>(cancellationToken: ct)
            ?? throw new TikTokApiException("TikTok video list endpoint returned an empty response.");

        ThrowIfError(payload.Error);
        return payload;
    }

    private static void ThrowIfError(TikTokApiError error)
    {
        if (!string.IsNullOrEmpty(error.Code) && !string.Equals(error.Code, "ok", StringComparison.OrdinalIgnoreCase))
        {
            throw new TikTokApiException(error.Message, error.Code, error.LogId);
        }
    }
}
