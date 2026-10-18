using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace XDashboard.Api.Services.X;

/// <summary>
/// Real, authenticated access to the X API v2 (plus two legacy v1.1 endpoints that have no v2
/// equivalent: profile text fields and profile image/banner uploads). Every public method here
/// performs a genuine HTTP call to api.x.com -- nothing in this class fabricates data.
/// </summary>
public class XApiClient : IXApiClient
{
    private const int ChunkSizeBytes = 4 * 1024 * 1024; // 4 MiB, well under X's per-chunk cap
    private const int MaxStatusPollAttempts = 60;

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly HttpClient _httpClient;
    private readonly IAccessTokenProvider _accessTokenProvider;
    private readonly ITokenStore _tokenStore;

    public XApiClient(HttpClient httpClient, IAccessTokenProvider accessTokenProvider, ITokenStore tokenStore)
    {
        _httpClient = httpClient;
        _accessTokenProvider = accessTokenProvider;
        _tokenStore = tokenStore;
    }

    public async Task<XUser> GetMeAsync(CancellationToken cancellationToken = default)
    {
        const string fields = "description,location,url,profile_image_url,profile_banner_url," +
            "verified,verified_type,subscription_type,pinned_tweet_id,created_at,public_metrics";
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/2/users/me?user.fields={fields}");
        var envelope = await SendAndDeserializeAsync<XApiEnvelope<XUser>>(request, cancellationToken);
        return envelope.Data ?? throw new XApiException(HttpStatusCode.BadGateway, "X did not return a user for /2/users/me.");
    }

    public async Task<TweetsPage> GetUserTweetsAsync(string userId, string? paginationToken, int maxResults, CancellationToken cancellationToken = default)
    {
        var clampedMax = Math.Clamp(maxResults, 5, 100);
        var url = $"/2/users/{userId}/tweets?max_results={clampedMax}" +
            "&tweet.fields=created_at,public_metrics,attachments" +
            "&expansions=attachments.media_keys" +
            "&media.fields=url,preview_image_url,type,duration_ms,variants" +
            "&exclude=retweets,replies";
        if (!string.IsNullOrEmpty(paginationToken))
        {
            url += $"&pagination_token={Uri.EscapeDataString(paginationToken)}";
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        var envelope = await SendAndDeserializeAsync<XApiEnvelope<List<XTweet>>>(request, cancellationToken);
        var mediaByKey = envelope.Includes?.Media?
            .Where(m => !string.IsNullOrEmpty(m.MediaKey))
            .ToDictionary(m => m.MediaKey) ?? new Dictionary<string, XMedia>();
        return new TweetsPage(envelope.Data ?? new List<XTweet>(), mediaByKey, envelope.Meta?.NextToken);
    }

    public async Task<(XTweet Tweet, Dictionary<string, XMedia> MediaByKey)?> GetTweetAsync(string tweetId, CancellationToken cancellationToken = default)
    {
        var url = $"/2/tweets/{tweetId}" +
            "?tweet.fields=created_at,public_metrics,attachments" +
            "&expansions=attachments.media_keys" +
            "&media.fields=url,preview_image_url,type,duration_ms,variants";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);

        XApiEnvelope<XTweet> envelope;
        try
        {
            envelope = await SendAndDeserializeAsync<XApiEnvelope<XTweet>>(request, cancellationToken);
        }
        catch (XApiException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return null;
        }

        if (envelope.Data is null)
        {
            return null;
        }

        var mediaByKey = envelope.Includes?.Media?
            .Where(m => !string.IsNullOrEmpty(m.MediaKey))
            .ToDictionary(m => m.MediaKey) ?? new Dictionary<string, XMedia>();
        return (envelope.Data, mediaByKey);
    }

    public async Task<XCreatedTweetResponse> CreateTweetAsync(string? text, IReadOnlyList<string>? mediaIds, CancellationToken cancellationToken = default)
    {
        var payload = new Dictionary<string, object>();
        if (!string.IsNullOrEmpty(text))
        {
            payload["text"] = text;
        }

        if (mediaIds is { Count: > 0 })
        {
            payload["media"] = new Dictionary<string, object> { ["media_ids"] = mediaIds };
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "/2/tweets")
        {
            Content = JsonContent.Create(payload),
        };
        var envelope = await SendAndDeserializeAsync<XApiEnvelope<XCreatedTweetResponse>>(request, cancellationToken);
        return envelope.Data ?? throw new XApiException(HttpStatusCode.BadGateway, "X did not return the created post.");
    }

    public async Task DeleteTweetAsync(string tweetId, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"/2/tweets/{tweetId}");
        using var response = await SendAuthenticatedAsync(request, cancellationToken);
    }

    public async Task PinTweetAsync(string userId, string tweetId, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/2/users/{userId}/pinned_tweets")
        {
            Content = JsonContent.Create(new { tweet_id = tweetId }),
        };
        using var response = await SendAuthenticatedAsync(request, cancellationToken);
    }

    public async Task UnpinTweetAsync(string userId, string tweetId, CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Delete, $"/2/users/{userId}/pinned_tweets/{tweetId}");
        using var response = await SendAuthenticatedAsync(request, cancellationToken);
    }

    public async Task<string> UploadMediaAsync(byte[] content, string mimeType, string mediaCategory, CancellationToken cancellationToken = default)
    {
        var mediaId = await InitMediaUploadAsync(content.LongLength, mimeType, mediaCategory, cancellationToken);

        var segmentIndex = 0;
        for (var offset = 0; offset < content.Length; offset += ChunkSizeBytes)
        {
            var length = Math.Min(ChunkSizeBytes, content.Length - offset);
            var chunk = new byte[length];
            Buffer.BlockCopy(content, offset, chunk, 0, length);
            await AppendMediaChunkAsync(mediaId, segmentIndex, chunk, cancellationToken);
            segmentIndex++;
        }

        await FinalizeMediaUploadAsync(mediaId, cancellationToken);
        await WaitForMediaProcessingAsync(mediaId, cancellationToken);
        return mediaId;
    }

    public async Task<XUser> UpdateLegacyProfileAsync(LegacyProfileFields fields, CancellationToken cancellationToken = default)
    {
        var form = new Dictionary<string, string> { ["include_entities"] = "false", ["skip_status"] = "true" };
        if (fields.Name is not null) form["name"] = fields.Name;
        if (fields.Url is not null) form["url"] = fields.Url;
        if (fields.Location is not null) form["location"] = fields.Location;
        if (fields.Description is not null) form["description"] = fields.Description;

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.x.com/1.1/account/update_profile.json")
        {
            Content = new FormUrlEncodedContent(form),
        };
        using var response = await SendAuthenticatedAsync(request, cancellationToken);

        // The v1.1 endpoint returns the legacy user object shape, which differs from the v2
        // fields the rest of this app uses (screen_name vs username, etc). Rather than maintain
        // a second mapping for a response we are about to re-fetch anyway, pull the canonical,
        // just-updated profile back from the v2 endpoint.
        return await GetMeAsync(cancellationToken);
    }

    public async Task<string> UpdateProfileImageAsync(byte[] imageBytes, string mimeType, CancellationToken cancellationToken = default)
    {
        using var form = new MultipartFormDataContent();
        var imageContent = new ByteArrayContent(imageBytes);
        imageContent.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
        form.Add(imageContent, "image", "profile-image");

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.x.com/1.1/account/update_profile_image.json")
        {
            Content = form,
        };
        using var response = await SendAuthenticatedAsync(request, cancellationToken);

        var updated = await GetMeAsync(cancellationToken);
        return updated.ProfileImageUrl ?? string.Empty;
    }

    public async Task<string> UpdateProfileBannerAsync(byte[] imageBytes, string mimeType, CancellationToken cancellationToken = default)
    {
        using var form = new MultipartFormDataContent();
        var imageContent = new ByteArrayContent(imageBytes);
        imageContent.Headers.ContentType = new MediaTypeHeaderValue(mimeType);
        form.Add(imageContent, "banner", "profile-banner");

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.x.com/1.1/account/update_profile_banner.json")
        {
            Content = form,
        };
        using var response = await SendAuthenticatedAsync(request, cancellationToken);

        var updated = await GetMeAsync(cancellationToken);
        return updated.ProfileBannerUrl ?? string.Empty;
    }

    private async Task<string> InitMediaUploadAsync(long totalBytes, string mimeType, string mediaCategory, CancellationToken cancellationToken)
    {
        using var form = new MultipartFormDataContent
        {
            { new StringContent("INIT"), "command" },
            { new StringContent(totalBytes.ToString()), "total_bytes" },
            { new StringContent(mimeType), "media_type" },
            { new StringContent(mediaCategory), "media_category" },
        };
        using var request = new HttpRequestMessage(HttpMethod.Post, "/2/media/upload") { Content = form };
        var response = await SendAndDeserializeAsync<XMediaUploadInitResponse>(request, cancellationToken);
        var id = response.Data?.Id;
        if (string.IsNullOrEmpty(id))
        {
            throw new XApiException(HttpStatusCode.BadGateway, "X did not return a media id for the upload.");
        }

        return id;
    }

    private async Task AppendMediaChunkAsync(string mediaId, int segmentIndex, byte[] chunk, CancellationToken cancellationToken)
    {
        using var form = new MultipartFormDataContent
        {
            { new StringContent("APPEND"), "command" },
            { new StringContent(mediaId), "media_id" },
            { new StringContent(segmentIndex.ToString()), "segment_index" },
        };
        var byteContent = new ByteArrayContent(chunk);
        byteContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        form.Add(byteContent, "media", "chunk");

        using var request = new HttpRequestMessage(HttpMethod.Post, "/2/media/upload") { Content = form };
        using var response = await SendAuthenticatedAsync(request, cancellationToken);
    }

    private async Task FinalizeMediaUploadAsync(string mediaId, CancellationToken cancellationToken)
    {
        using var form = new MultipartFormDataContent
        {
            { new StringContent("FINALIZE"), "command" },
            { new StringContent(mediaId), "media_id" },
        };
        using var request = new HttpRequestMessage(HttpMethod.Post, "/2/media/upload") { Content = form };
        using var response = await SendAuthenticatedAsync(request, cancellationToken);
    }

    private async Task WaitForMediaProcessingAsync(string mediaId, CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < MaxStatusPollAttempts; attempt++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"/2/media/upload?command=STATUS&media_id={mediaId}");
            var response = await SendAndDeserializeAsync<XMediaUploadInitResponse>(request, cancellationToken);
            var info = response.Data?.ProcessingInfo;
            if (info is null)
            {
                return; // Stills typically need no post-processing wait.
            }

            switch (info.State)
            {
                case "succeeded":
                    return;
                case "failed":
                    var detail = info.Error?.Message ?? info.Error?.Detail ?? "unknown error";
                    throw new XApiException(HttpStatusCode.BadGateway, $"X failed to process the uploaded media: {detail}");
                default:
                    var waitSeconds = Math.Clamp(info.CheckAfterSecs ?? 1, 1, 10);
                    await Task.Delay(TimeSpan.FromSeconds(waitSeconds), cancellationToken);
                    break;
            }
        }

        throw new XApiException(HttpStatusCode.GatewayTimeout, "Timed out waiting for X to finish processing the uploaded media.");
    }

    private async Task<T> SendAndDeserializeAsync<T>(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        using var response = await SendAuthenticatedAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        return JsonSerializer.Deserialize<T>(body, JsonOptions)
            ?? throw new XApiException(response.StatusCode, "X returned an empty or unparseable response body.");
    }

    private async Task<HttpResponseMessage> SendAuthenticatedAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var accessToken = await _accessTokenProvider.GetAccessTokenAsync(cancellationToken);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, cancellationToken);
        return response;
    }

    private async Task EnsureSuccessAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        var message = ExtractErrorMessage(body) ?? response.ReasonPhrase ?? "Unknown X API error";

        if (response.StatusCode == HttpStatusCode.Unauthorized)
        {
            // The access token was rejected outright (not just expired -- we refresh proactively
            // before that happens). Most likely the user revoked access on X's side.
            await _tokenStore.ClearAsync(cancellationToken);
            throw new XNotConnectedException();
        }

        if ((int)response.StatusCode == 429)
        {
            int? retryAfterSeconds = null;
            if (response.Headers.TryGetValues("x-rate-limit-reset", out var resetValues)
                && long.TryParse(resetValues.FirstOrDefault(), out var resetEpochSeconds))
            {
                retryAfterSeconds = (int)Math.Max(0, resetEpochSeconds - DateTimeOffset.UtcNow.ToUnixTimeSeconds());
            }

            throw new XApiException(
                response.StatusCode,
                $"X API rate limit exceeded: {message}",
                message,
                isRateLimited: true,
                retryAfterSeconds: retryAfterSeconds);
        }

        throw new XApiException(response.StatusCode, $"X API error ({(int)response.StatusCode}): {message}", message);
    }

    private static string? ExtractErrorMessage(string body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(body);
            var root = document.RootElement;

            if (root.TryGetProperty("errors", out var errors) && errors.ValueKind == JsonValueKind.Array && errors.GetArrayLength() > 0)
            {
                var first = errors[0];
                if (first.TryGetProperty("message", out var message) && message.ValueKind == JsonValueKind.String)
                {
                    return message.GetString();
                }

                if (first.TryGetProperty("detail", out var detail) && detail.ValueKind == JsonValueKind.String)
                {
                    return detail.GetString();
                }
            }

            if (root.TryGetProperty("detail", out var detailProp) && detailProp.ValueKind == JsonValueKind.String)
            {
                return detailProp.GetString();
            }

            if (root.TryGetProperty("title", out var titleProp) && titleProp.ValueKind == JsonValueKind.String)
            {
                return titleProp.GetString();
            }

            if (root.TryGetProperty("error_description", out var errorDescription) && errorDescription.ValueKind == JsonValueKind.String)
            {
                return errorDescription.GetString();
            }

            if (root.TryGetProperty("error", out var errorProp) && errorProp.ValueKind == JsonValueKind.String)
            {
                return errorProp.GetString();
            }
        }
        catch (JsonException)
        {
            // Not JSON (some error responses are plain text / HTML); fall through to raw body.
        }

        return body.Length > 500 ? body[..500] : body;
    }
}
