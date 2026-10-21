using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using Tisoro.LinkedIn.Api.Configuration;
using Tisoro.LinkedIn.Api.Models;

namespace Tisoro.LinkedIn.Api.Services.LinkedIn;

public interface ILinkedInApiClient
{
    Task<string> UploadImageAsync(string ownerUrn, string accessToken, byte[] bytes);
    Task<string> UploadDocumentAsync(string ownerUrn, string accessToken, byte[] bytes);
    Task<string> UploadVideoAsync(string ownerUrn, string accessToken, byte[] bytes);
    Task<string> CreatePostAsync(PostPublishSpec spec, string accessToken);
}

/// <summary>
/// Thin wrapper over LinkedIn's Community Management REST API (Images,
/// Documents, Videos upload endpoints + the Posts API). Every call carries
/// the LinkedIn-Version and X-Restli-Protocol-Version headers LinkedIn's
/// REST API requires; every failure response body is logged (not just the
/// status) because LinkedIn's error payloads are the only place that says
/// *why* (missing scope, org not approved, asset too large, etc).
/// </summary>
public sealed class LinkedInApiClient : ILinkedInApiClient
{
    private readonly LinkedInOptions _options;
    private readonly HttpClient _http;
    private readonly ILogger<LinkedInApiClient> _logger;

    public LinkedInApiClient(IOptions<LinkedInOptions> options, IHttpClientFactory httpClientFactory, ILogger<LinkedInApiClient> logger)
    {
        _options = options.Value;
        _http = httpClientFactory.CreateClient("LinkedIn");
        _logger = logger;
    }

    public async Task<string> UploadImageAsync(string ownerUrn, string accessToken, byte[] bytes)
    {
        var init = await InitializeUploadAsync("images", ownerUrn, accessToken, extra: null);
        var uploadUrl = init["value"]!["uploadUrl"]!.GetValue<string>();
        var assetUrn = init["value"]!["image"]!.GetValue<string>();

        await PutBinaryAsync(uploadUrl, accessToken, bytes, rangeStart: null, rangeEnd: null);
        return assetUrn;
    }

    public async Task<string> UploadDocumentAsync(string ownerUrn, string accessToken, byte[] bytes)
    {
        var init = await InitializeUploadAsync("documents", ownerUrn, accessToken, extra: null);
        var uploadUrl = init["value"]!["uploadUrl"]!.GetValue<string>();
        var assetUrn = init["value"]!["document"]!.GetValue<string>();

        await PutBinaryAsync(uploadUrl, accessToken, bytes, rangeStart: null, rangeEnd: null);
        return assetUrn;
    }

    public async Task<string> UploadVideoAsync(string ownerUrn, string accessToken, byte[] bytes)
    {
        var extra = new JsonObject
        {
            ["fileSizeBytes"] = bytes.Length,
            ["uploadCaptions"] = false,
            ["uploadThumbnail"] = false,
        };
        var init = await InitializeUploadAsync("videos", ownerUrn, accessToken, extra);

        var value = init["value"]!;
        var assetUrn = value["video"]!.GetValue<string>();
        var uploadToken = value["uploadToken"]?.GetValue<string>() ?? "";
        var instructions = value["uploadInstructions"]!.AsArray();

        var uploadedPartIds = new List<string>();
        foreach (var instruction in instructions)
        {
            var uploadUrl = instruction!["uploadUrl"]!.GetValue<string>();
            var firstByte = instruction["firstByte"]!.GetValue<long>();
            var lastByte = instruction["lastByte"]!.GetValue<long>();

            var chunkLength = (int)(lastByte - firstByte + 1);
            var chunk = new byte[chunkLength];
            Array.Copy(bytes, firstByte, chunk, 0, chunkLength);

            var etag = await PutBinaryAsync(uploadUrl, accessToken, chunk, rangeStart: null, rangeEnd: null);
            if (string.IsNullOrEmpty(etag))
            {
                throw new LinkedInApiException("LinkedIn did not return an ETag for a video upload part.");
            }
            uploadedPartIds.Add(etag);
        }

        await FinalizeVideoUploadAsync(assetUrn, uploadToken, uploadedPartIds, accessToken);
        return assetUrn;
    }

    private async Task FinalizeVideoUploadAsync(string videoUrn, string uploadToken, List<string> uploadedPartIds, string accessToken)
    {
        var body = new JsonObject
        {
            ["finalizeUploadRequest"] = new JsonObject
            {
                ["video"] = videoUrn,
                ["uploadToken"] = uploadToken,
                ["uploadedPartIds"] = new JsonArray(uploadedPartIds.Select(id => JsonValue.Create(id) as JsonNode).ToArray()),
            },
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.ApiBaseUrl}/rest/videos?action=finalizeUpload");
        ApplyStandardHeaders(request, accessToken);
        request.Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json");

        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("LinkedIn video finalize failed: {Status} {Body}", (int)response.StatusCode, responseBody);
            throw new LinkedInApiException($"LinkedIn video finalize failed with status {(int)response.StatusCode}.");
        }
    }

    private async Task<JsonObject> InitializeUploadAsync(string assetKind, string ownerUrn, string accessToken, JsonObject? extra)
    {
        var initRequest = new JsonObject { ["owner"] = ownerUrn };
        if (extra is not null)
        {
            foreach (var (key, value) in extra)
            {
                initRequest[key] = value?.DeepClone();
            }
        }

        var body = new JsonObject { ["initializeUploadRequest"] = initRequest };

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.ApiBaseUrl}/rest/{assetKind}?action=initializeUpload");
        ApplyStandardHeaders(request, accessToken);
        request.Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json");

        using var response = await _http.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("LinkedIn {AssetKind} initializeUpload failed: {Status} {Body}", assetKind, (int)response.StatusCode, responseBody);
            throw new LinkedInApiException($"LinkedIn {assetKind} upload could not be initialized (status {(int)response.StatusCode}).");
        }

        return JsonNode.Parse(responseBody)!.AsObject();
    }

    private async Task<string?> PutBinaryAsync(string uploadUrl, string accessToken, byte[] bytes, long? rangeStart, long? rangeEnd)
    {
        using var request = new HttpRequestMessage(HttpMethod.Put, uploadUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Content = new ByteArrayContent(bytes);

        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("LinkedIn binary upload failed: {Status} {Body}", (int)response.StatusCode, responseBody);
            throw new LinkedInApiException($"Uploading media to LinkedIn failed with status {(int)response.StatusCode}.");
        }

        return response.Headers.ETag?.Tag;
    }

    public async Task<string> CreatePostAsync(PostPublishSpec spec, string accessToken)
    {
        var body = BuildPostBody(spec);

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_options.ApiBaseUrl}/rest/posts");
        ApplyStandardHeaders(request, accessToken);
        request.Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json");

        using var response = await _http.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("LinkedIn create post failed: {Status} {Body}", (int)response.StatusCode, responseBody);
            throw new LinkedInApiException($"LinkedIn rejected the post (status {(int)response.StatusCode}): {responseBody}");
        }

        var postUrn = response.Headers.TryGetValues("x-restli-id", out var values) ? values.FirstOrDefault() : null;
        if (string.IsNullOrEmpty(postUrn))
        {
            throw new LinkedInApiException("LinkedIn accepted the post but did not return its URN.");
        }
        return postUrn;
    }

    internal static JsonObject BuildPostBody(PostPublishSpec spec)
    {
        var body = new JsonObject
        {
            ["author"] = spec.AuthorUrn,
            ["commentary"] = spec.Body,
            ["visibility"] = "PUBLIC",
            ["lifecycleState"] = "PUBLISHED",
            ["isReshareDisabledByAuthor"] = false,
            ["distribution"] = new JsonObject
            {
                ["feedDistribution"] = "MAIN_FEED",
                ["targetEntities"] = new JsonArray(),
                ["thirdPartyDistributionChannels"] = new JsonArray(),
            },
        };

        switch (spec.ContentType)
        {
            case PostContentType.Text:
                break;

            case PostContentType.Image:
                body["content"] = new JsonObject
                {
                    ["media"] = new JsonObject { ["id"] = spec.MediaUrns[0] },
                };
                break;

            case PostContentType.MultiImage:
                body["content"] = new JsonObject
                {
                    ["multiImage"] = new JsonObject
                    {
                        ["images"] = new JsonArray(spec.MediaUrns
                            .Select(urn => (JsonNode)new JsonObject { ["id"] = urn })
                            .ToArray()),
                    },
                };
                break;

            case PostContentType.Video:
                body["content"] = new JsonObject
                {
                    ["media"] = new JsonObject { ["id"] = spec.MediaUrns[0] },
                };
                break;

            case PostContentType.Document:
                body["content"] = new JsonObject
                {
                    ["media"] = new JsonObject
                    {
                        ["id"] = spec.MediaUrns[0],
                        ["title"] = spec.Title ?? "",
                    },
                };
                break;

            case PostContentType.ArticleLink:
                body["content"] = new JsonObject
                {
                    ["article"] = new JsonObject
                    {
                        ["source"] = spec.ExternalLinkUrl,
                        ["title"] = spec.Title ?? "",
                    },
                };
                break;
        }

        return body;
    }

    private void ApplyStandardHeaders(HttpRequestMessage request, string accessToken)
    {
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Add("LinkedIn-Version", _options.ApiVersion);
        request.Headers.Add("X-Restli-Protocol-Version", "2.0.0");
    }
}
