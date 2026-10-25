using System.Net;
using Instagram.Api.Clients;
using Instagram.Api.Configuration;
using Microsoft.Extensions.Options;
using Xunit;

namespace Instagram.Api.Tests.Clients;

public class InstagramGraphClientTests
{
    private static InstagramApiOptions CreateOptions() => new()
    {
        ClientId = "test-client-id",
        ClientSecret = "test-client-secret",
        RedirectUri = "https://app.example.com/callback",
        GraphApiBaseUrl = "https://graph.instagram.test",
        GraphApiVersion = "v21.0"
    };

    private static InstagramGraphClient CreateClient(FakeHttpMessageHandler handler)
    {
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("https://graph.instagram.test") };
        return new InstagramGraphClient(httpClient, Options.Create(CreateOptions()));
    }

    [Fact]
    public void BuildAuthorizationUrl_IncludesRequiredOAuthParameters()
    {
        var client = CreateClient(new FakeHttpMessageHandler(_ => FakeHttpMessageHandler.JsonResponse(HttpStatusCode.OK, "{}")));

        var url = client.BuildAuthorizationUrl("state-123", "challenge-abc");

        Assert.Contains("client_id=test-client-id", url);
        Assert.Contains("state=state-123", url);
        Assert.Contains("code_challenge=challenge-abc", url);
        Assert.Contains("code_challenge_method=S256", url);
    }

    [Fact]
    public async Task GetProfileAsync_OnSuccess_DeserializesProfile()
    {
        const string json = """
        {"user_id":"17841400000000","username":"tester","account_type":"BUSINESS","name":"Tester",
         "profile_picture_url":"https://example.com/p.jpg","biography":"bio","website":"https://example.com",
         "followers_count":100,"media_count":5}
        """;
        var handler = new FakeHttpMessageHandler(_ => FakeHttpMessageHandler.JsonResponse(HttpStatusCode.OK, json));
        var client = CreateClient(handler);

        var profile = await client.GetProfileAsync("fake-token", CancellationToken.None);

        Assert.Equal("tester", profile.Username);
        Assert.Equal(100, profile.FollowersCount);
    }

    [Fact]
    public async Task GetProfileAsync_OnGraphError_ThrowsInstagramApiExceptionWithMessage()
    {
        const string errorJson = """{"error":{"message":"Invalid OAuth access token.","type":"OAuthException","code":190}}""";
        var handler = new FakeHttpMessageHandler(_ => FakeHttpMessageHandler.JsonResponse(HttpStatusCode.BadRequest, errorJson));
        var client = CreateClient(handler);

        var ex = await Assert.ThrowsAsync<InstagramApiException>(
            () => client.GetProfileAsync("expired-token", CancellationToken.None));

        Assert.Equal("Invalid OAuth access token.", ex.Message);
        Assert.Equal(400, ex.StatusCode);
    }

    [Fact]
    public async Task PublishContainerAsync_OnSuccess_ReturnsMediaId()
    {
        const string json = """{"id":"17900000000000"}""";
        var handler = new FakeHttpMessageHandler(_ => FakeHttpMessageHandler.JsonResponse(HttpStatusCode.OK, json));
        var client = CreateClient(handler);

        var result = await client.PublishContainerAsync("17841400000000", "token", "container-1", CancellationToken.None);

        Assert.Equal("17900000000000", result.Id);
    }

    [Fact]
    public async Task GetContainerStatusAsync_WhenRateLimited_PropagatesStatusCodeToException()
    {
        var handler = new FakeHttpMessageHandler(_ =>
            FakeHttpMessageHandler.JsonResponse(HttpStatusCode.TooManyRequests, """{"error":{"message":"Rate limit exceeded.","code":4}}"""));
        var client = CreateClient(handler);

        var ex = await Assert.ThrowsAsync<InstagramApiException>(
            () => client.GetContainerStatusAsync("container-1", "token", CancellationToken.None));

        Assert.Equal(429, ex.StatusCode);
        Assert.Equal(1, handler.CallCount);
    }
}
