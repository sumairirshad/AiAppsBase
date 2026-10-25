using System.Net;
using Microsoft.Extensions.Options;
using TikTok.Api.Clients;
using TikTok.Api.Configuration;
using TikTok.Api.Models.TikTok;
using TikTok.Api.Tests.TestSupport;

namespace TikTok.Api.Tests.Clients;

public class TikTokApiClientTests
{
    private static TikTokApiClient CreateClient(FakeHttpMessageHandler handler)
    {
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://open.tiktokapis.com") };
        var options = Options.Create(new TikTokOptions
        {
            ClientKey = "key",
            ClientSecret = "secret",
            RedirectUri = "https://app.example.com/callback",
            TokenUrl = "https://open.tiktokapis.com/v2/oauth/token/",
            ApiBaseUrl = "https://open.tiktokapis.com"
        });
        return new TikTokApiClient(httpClient, options);
    }

    [Fact]
    public async Task ExchangeCodeForTokenAsync_OnSuccess_ReturnsParsedToken()
    {
        var handler = new FakeHttpMessageHandler().Enqueue(HttpStatusCode.OK, """
            {"access_token":"tok","expires_in":86400,"open_id":"open123","refresh_token":"ref","refresh_expires_in":31536000,"scope":"user.info.basic","token_type":"Bearer"}
            """);
        var client = CreateClient(handler);

        var result = await client.ExchangeCodeForTokenAsync("code", "verifier", CancellationToken.None);

        Assert.Equal("tok", result.AccessToken);
        Assert.Equal("open123", result.OpenId);
    }

    [Fact]
    public async Task ExchangeCodeForTokenAsync_OnError_ThrowsTikTokApiException()
    {
        var handler = new FakeHttpMessageHandler().Enqueue(HttpStatusCode.BadRequest, """
            {"error":"invalid_grant","error_description":"The authorization code is invalid or expired."}
            """);
        var client = CreateClient(handler);

        await Assert.ThrowsAsync<TikTokApiException>(() =>
            client.ExchangeCodeForTokenAsync("bad-code", "verifier", CancellationToken.None));
    }

    [Fact]
    public async Task FetchPublishStatusAsync_DirectPostComplete_ReturnsPublicPostId()
    {
        var handler = new FakeHttpMessageHandler().Enqueue(HttpStatusCode.OK, """
            {"data":{"status":"PUBLISH_COMPLETE","publicaly_available_post_id":["7123456789"]},"error":{"code":"ok","message":"","log_id":"abc"}}
            """);
        var client = CreateClient(handler);

        var result = await client.FetchPublishStatusAsync("token", "publish-id-1", CancellationToken.None);

        Assert.Equal("PUBLISH_COMPLETE", result.Data.Status);
        Assert.Contains("7123456789", result.Data.PublicAvailablePostIds!);
    }

    [Fact]
    public async Task FetchPublishStatusAsync_MediaUploadComplete_HasNoPublicPostId()
    {
        var handler = new FakeHttpMessageHandler().Enqueue(HttpStatusCode.OK, """
            {"data":{"status":"PUBLISH_COMPLETE","publicaly_available_post_id":[]},"error":{"code":"ok","message":"","log_id":"abc"}}
            """);
        var client = CreateClient(handler);

        var result = await client.FetchPublishStatusAsync("token", "publish-id-2", CancellationToken.None);

        Assert.Equal("PUBLISH_COMPLETE", result.Data.Status);
        Assert.Empty(result.Data.PublicAvailablePostIds!);
    }

    [Fact]
    public async Task FetchPublishStatusAsync_Failed_ThrowsWithFailReason()
    {
        var handler = new FakeHttpMessageHandler().Enqueue(HttpStatusCode.OK, """
            {"data":{"status":"FAILED","fail_reason":"picture_size_check_failed"},"error":{"code":"ok","message":"","log_id":"abc"}}
            """);
        var client = CreateClient(handler);

        var result = await client.FetchPublishStatusAsync("token", "publish-id-3", CancellationToken.None);

        Assert.Equal("FAILED", result.Data.Status);
        Assert.Equal("picture_size_check_failed", result.Data.FailReason);
    }

    [Fact]
    public async Task GetUserInfoAsync_OnApiError_ThrowsTikTokApiException()
    {
        var handler = new FakeHttpMessageHandler().Enqueue(HttpStatusCode.OK, """
            {"data":{"user":{}},"error":{"code":"access_token_invalid","message":"The access token is invalid or has expired.","log_id":"xyz"}}
            """);
        var client = CreateClient(handler);

        var ex = await Assert.ThrowsAsync<TikTokApiException>(() =>
            client.GetUserInfoAsync("expired-token", CancellationToken.None));
        Assert.Equal("access_token_invalid", ex.TikTokErrorCode);
    }
}
