using System.Net.Http.Json;
using System.Text.Json;
using System.Web;
using Instagram.Api.Configuration;
using Instagram.Api.Entities;
using Microsoft.Extensions.Options;

namespace Instagram.Api.Clients;

public class InstagramGraphClient(HttpClient httpClient, IOptions<InstagramApiOptions> options)
    : IInstagramGraphClient
{
    private readonly InstagramApiOptions _options = options.Value;

    public string BuildAuthorizationUrl(string state, string codeChallenge)
    {
        var query = HttpUtility.ParseQueryString(string.Empty);
        query["client_id"] = _options.ClientId;
        query["redirect_uri"] = _options.RedirectUri;
        query["response_type"] = "code";
        query["scope"] = string.Join(",", _options.Scopes);
        query["state"] = state;
        query["code_challenge"] = codeChallenge;
        query["code_challenge_method"] = "S256";
        return $"{_options.AuthorizationBaseUrl}?{query}";
    }

    public async Task<ShortLivedTokenResponse> ExchangeCodeForShortLivedTokenAsync(string code, CancellationToken ct)
    {
        var form = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = _options.ClientId,
            ["client_secret"] = _options.ClientSecret,
            ["grant_type"] = "authorization_code",
            ["redirect_uri"] = _options.RedirectUri,
            ["code"] = code
        });

        using var response = await httpClient.PostAsync(_options.TokenExchangeUrl, form, ct);
        return await ReadOrThrowAsync<ShortLivedTokenResponse>(response, ct);
    }

    public async Task<LongLivedTokenResponse> ExchangeForLongLivedTokenAsync(string shortLivedAccessToken, CancellationToken ct)
    {
        var url = $"{_options.GraphApiBaseUrl}/access_token" +
            $"?grant_type=ig_exchange_token&client_secret={Uri.EscapeDataString(_options.ClientSecret)}" +
            $"&access_token={Uri.EscapeDataString(shortLivedAccessToken)}";

        using var response = await httpClient.GetAsync(url, ct);
        return await ReadOrThrowAsync<LongLivedTokenResponse>(response, ct);
    }

    public async Task<LongLivedTokenResponse> RefreshLongLivedTokenAsync(string longLivedAccessToken, CancellationToken ct)
    {
        var url = $"{_options.GraphApiBaseUrl}/refresh_access_token" +
            $"?grant_type=ig_refresh_token&access_token={Uri.EscapeDataString(longLivedAccessToken)}";

        using var response = await httpClient.GetAsync(url, ct);
        return await ReadOrThrowAsync<LongLivedTokenResponse>(response, ct);
    }

    public async Task<InstagramProfile> GetProfileAsync(string accessToken, CancellationToken ct)
    {
        const string fields = "user_id,username,account_type,name,profile_picture_url,biography,website,followers_count,media_count";
        var url = $"{VersionedBaseUrl}/me?fields={fields}&access_token={Uri.EscapeDataString(accessToken)}";

        using var response = await httpClient.GetAsync(url, ct);
        return await ReadOrThrowAsync<InstagramProfile>(response, ct);
    }

    public async Task<MediaContainerResponse> CreateImageContainerAsync(
        string igUserId, string accessToken, string imageUrl, string? caption, bool isCarouselItem, CancellationToken ct)
    {
        var form = new Dictionary<string, string>
        {
            ["image_url"] = imageUrl,
            ["access_token"] = accessToken
        };
        if (!string.IsNullOrWhiteSpace(caption)) form["caption"] = caption;
        if (isCarouselItem) form["is_carousel_item"] = "true";

        return await CreateContainerAsync(igUserId, form, ct);
    }

    public async Task<MediaContainerResponse> CreateVideoContainerAsync(
        string igUserId, string accessToken, string videoUrl, string? caption, InstagramContentType contentType, bool isCarouselItem, CancellationToken ct)
    {
        var mediaType = contentType switch
        {
            InstagramContentType.Reels => "REELS",
            InstagramContentType.Story => "STORIES",
            _ => "VIDEO"
        };

        var form = new Dictionary<string, string>
        {
            ["video_url"] = videoUrl,
            ["media_type"] = mediaType,
            ["access_token"] = accessToken
        };
        if (!string.IsNullOrWhiteSpace(caption)) form["caption"] = caption;
        if (isCarouselItem) form["is_carousel_item"] = "true";

        return await CreateContainerAsync(igUserId, form, ct);
    }

    public async Task<MediaContainerResponse> CreateCarouselContainerAsync(
        string igUserId, string accessToken, IReadOnlyList<string> childContainerIds, string? caption, CancellationToken ct)
    {
        var form = new Dictionary<string, string>
        {
            ["media_type"] = "CAROUSEL",
            ["children"] = string.Join(",", childContainerIds),
            ["access_token"] = accessToken
        };
        if (!string.IsNullOrWhiteSpace(caption)) form["caption"] = caption;

        return await CreateContainerAsync(igUserId, form, ct);
    }

    private async Task<MediaContainerResponse> CreateContainerAsync(
        string igUserId, Dictionary<string, string> form, CancellationToken ct)
    {
        var url = $"{VersionedBaseUrl}/{igUserId}/media";
        using var response = await httpClient.PostAsync(url, new FormUrlEncodedContent(form), ct);
        return await ReadOrThrowAsync<MediaContainerResponse>(response, ct);
    }

    public async Task<ContainerStatusResponse> GetContainerStatusAsync(string containerId, string accessToken, CancellationToken ct)
    {
        var url = $"{VersionedBaseUrl}/{containerId}?fields=status_code,id&access_token={Uri.EscapeDataString(accessToken)}";
        using var response = await httpClient.GetAsync(url, ct);
        return await ReadOrThrowAsync<ContainerStatusResponse>(response, ct);
    }

    public async Task<MediaPublishResponse> PublishContainerAsync(string igUserId, string accessToken, string creationId, CancellationToken ct)
    {
        var url = $"{VersionedBaseUrl}/{igUserId}/media_publish";
        var form = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["creation_id"] = creationId,
            ["access_token"] = accessToken
        });

        using var response = await httpClient.PostAsync(url, form, ct);
        return await ReadOrThrowAsync<MediaPublishResponse>(response, ct);
    }

    public async Task<PublishingLimitResponse> GetPublishingLimitAsync(string igUserId, string accessToken, CancellationToken ct)
    {
        var url = $"{VersionedBaseUrl}/{igUserId}/content_publishing_limit?fields=config,quota_usage&access_token={Uri.EscapeDataString(accessToken)}";
        using var response = await httpClient.GetAsync(url, ct);
        return await ReadOrThrowAsync<PublishingLimitResponse>(response, ct);
    }

    public async Task<InsightsResponse> GetMediaInsightsAsync(string mediaId, string accessToken, IReadOnlyList<string> metrics, CancellationToken ct)
    {
        var url = $"{VersionedBaseUrl}/{mediaId}/insights?metric={string.Join(",", metrics)}&access_token={Uri.EscapeDataString(accessToken)}";
        using var response = await httpClient.GetAsync(url, ct);
        return await ReadOrThrowAsync<InsightsResponse>(response, ct);
    }

    public async Task<InsightsResponse> GetAccountInsightsAsync(string igUserId, string accessToken, IReadOnlyList<string> metrics, string period, CancellationToken ct)
    {
        var url = $"{VersionedBaseUrl}/{igUserId}/insights?metric={string.Join(",", metrics)}&period={period}&access_token={Uri.EscapeDataString(accessToken)}";
        using var response = await httpClient.GetAsync(url, ct);
        return await ReadOrThrowAsync<InsightsResponse>(response, ct);
    }

    public async Task<CommentsResponse> GetCommentsAsync(string mediaId, string accessToken, CancellationToken ct)
    {
        var url = $"{VersionedBaseUrl}/{mediaId}/comments?fields=id,text,username,timestamp,hidden&access_token={Uri.EscapeDataString(accessToken)}";
        using var response = await httpClient.GetAsync(url, ct);
        return await ReadOrThrowAsync<CommentsResponse>(response, ct);
    }

    public async Task<string> PostCommentReplyAsync(string commentId, string accessToken, string message, CancellationToken ct)
    {
        var url = $"{VersionedBaseUrl}/{commentId}/replies";
        var form = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["message"] = message,
            ["access_token"] = accessToken
        });

        using var response = await httpClient.PostAsync(url, form, ct);
        var result = await ReadOrThrowAsync<MediaContainerResponse>(response, ct);
        return result.Id;
    }

    public async Task SetCommentHiddenAsync(string commentId, string accessToken, bool hidden, CancellationToken ct)
    {
        var url = $"{VersionedBaseUrl}/{commentId}";
        var form = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["hidden"] = hidden ? "true" : "false",
            ["access_token"] = accessToken
        });

        using var response = await httpClient.PostAsync(url, form, ct);
        await EnsureSuccessAsync(response, ct);
    }

    public async Task DeleteCommentAsync(string commentId, string accessToken, CancellationToken ct)
    {
        var url = $"{VersionedBaseUrl}/{commentId}?access_token={Uri.EscapeDataString(accessToken)}";
        using var response = await httpClient.DeleteAsync(url, ct);
        await EnsureSuccessAsync(response, ct);
    }

    private string VersionedBaseUrl => $"{_options.GraphApiBaseUrl}/{_options.GraphApiVersion}";

    private static async Task<T> ReadOrThrowAsync<T>(HttpResponseMessage response, CancellationToken ct)
    {
        await EnsureSuccessAsync(response, ct);
        var result = await response.Content.ReadFromJsonAsync<T>(cancellationToken: ct);
        return result ?? throw new InstagramApiException("Instagram API returned an empty response body.");
    }

    private static async Task EnsureSuccessAsync(HttpResponseMessage response, CancellationToken ct)
    {
        if (response.IsSuccessStatusCode) return;

        var body = await response.Content.ReadAsStringAsync(ct);
        GraphError? error = null;
        try
        {
            error = JsonSerializer.Deserialize<GraphErrorEnvelope>(body)?.Error;
        }
        catch (JsonException)
        {
        }

        throw new InstagramApiException(
            error?.Message ?? $"Instagram API request failed with status {(int)response.StatusCode}.",
            (int)response.StatusCode,
            error?.Type);
    }
}
