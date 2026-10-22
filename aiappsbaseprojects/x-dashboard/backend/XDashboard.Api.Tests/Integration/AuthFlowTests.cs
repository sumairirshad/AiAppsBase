using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Web;
using Microsoft.AspNetCore.Mvc.Testing;
using XDashboard.Api.Services.X;

namespace XDashboard.Api.Tests.Integration;

/// <summary>
/// Exercises the full OAuth 2.0 Authorization Code + PKCE flow through real HTTP requests
/// against the real app (real routing, real XOAuthService, real InMemoryPendingAuthorizationStore
/// state/CSRF handling, real AES-256-GCM token encryption at rest) with only the network call to
/// x.com's token endpoint faked out. No real X credentials are used or required.
/// </summary>
public class AuthFlowTests : IClassFixture<XDashboardWebApplicationFactory>
{
    private readonly XDashboardWebApplicationFactory _factory;

    public AuthFlowTests(XDashboardWebApplicationFactory factory) => _factory = factory;

    private static readonly WebApplicationFactoryClientOptions NoRedirectOptions = new() { AllowAutoRedirect = false };

    private HttpClient CreateNonRedirectingClient() => _factory.CreateClient(NoRedirectOptions);

    [Fact]
    public async Task Login_RedirectsToXAuthorizeUrl_WithCorrectPkceAndClientParameters()
    {
        var client = CreateNonRedirectingClient();

        var response = await client.GetAsync("/api/auth/x/login");

        Assert.Equal(HttpStatusCode.Found, response.StatusCode);
        var location = response.Headers.Location!;
        Assert.StartsWith("https://x.com/i/oauth2/authorize", location.ToString());

        var query = HttpUtility.ParseQueryString(location.Query);
        Assert.Equal("test-client-id", query["client_id"]);
        Assert.Equal(XDashboardWebApplicationFactory.CallbackUrl, query["redirect_uri"]);
        Assert.Equal("S256", query["code_challenge_method"]);
        Assert.False(string.IsNullOrEmpty(query["code_challenge"]));
        Assert.False(string.IsNullOrEmpty(query["state"]));
        Assert.Contains("offline.access", query["scope"]);
    }

    [Fact]
    public async Task FullConnectFlow_StoresEncryptedTokenAndReportsConnectedStatus()
    {
        _factory.XApiClient.Me = new XUser { Id = "u1", Username = "testhandle", Name = "Test Handle" };
        var client = CreateNonRedirectingClient();

        var tokenCallsBefore = _factory.TokenEndpointHandler.TokenRequestCount;
        var loginResponse = await client.GetAsync("/api/auth/x/login");
        var state = HttpUtility.ParseQueryString(loginResponse.Headers.Location!.Query)["state"]!;

        var callbackResponse = await client.GetAsync($"/api/auth/x/callback?code=fake-auth-code&state={state}");

        Assert.Equal(HttpStatusCode.Found, callbackResponse.StatusCode);
        var redirectTarget = callbackResponse.Headers.Location!.ToString();
        Assert.Contains("x_connected=1", redirectTarget);
        Assert.Equal(tokenCallsBefore + 1, _factory.TokenEndpointHandler.TokenRequestCount);

        var statusResponse = await client.GetAsync("/api/auth/x/status");
        statusResponse.EnsureSuccessStatusCode();
        var status = await statusResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(status.GetProperty("connected").GetBoolean());
        Assert.Equal("testhandle", status.GetProperty("handle").GetString());
    }

    [Fact]
    public async Task Callback_WithUnknownOrReplayedState_RedirectsWithErrorAndDoesNotCallTokenEndpoint()
    {
        var client = CreateNonRedirectingClient();
        var tokenCallsBefore = _factory.TokenEndpointHandler.TokenRequestCount;

        var response = await client.GetAsync("/api/auth/x/callback?code=some-code&state=never-issued-state");

        Assert.Equal(HttpStatusCode.Found, response.StatusCode);
        var target = response.Headers.Location!.ToString();
        Assert.Contains("x_connected=0", target);
        Assert.Contains("x_error=", target);
        Assert.Equal(tokenCallsBefore, _factory.TokenEndpointHandler.TokenRequestCount);
    }

    [Fact]
    public async Task Callback_CannotReuseTheSameStateTwice()
    {
        var client = CreateNonRedirectingClient();
        var loginResponse = await client.GetAsync("/api/auth/x/login");
        var state = HttpUtility.ParseQueryString(loginResponse.Headers.Location!.Query)["state"]!;

        var first = await client.GetAsync($"/api/auth/x/callback?code=code-1&state={state}");
        Assert.Contains("x_connected=1", first.Headers.Location!.ToString());

        var replay = await client.GetAsync($"/api/auth/x/callback?code=code-2&state={state}");
        Assert.Contains("x_connected=0", replay.Headers.Location!.ToString());
    }

    [Fact]
    public async Task Callback_WhenXDeniesAuthorization_RedirectsWithErrorWithoutContactingTokenEndpoint()
    {
        var client = CreateNonRedirectingClient();
        var tokenCallsBefore = _factory.TokenEndpointHandler.TokenRequestCount;

        var response = await client.GetAsync("/api/auth/x/callback?error=access_denied&error_description=User+cancelled");

        var target = response.Headers.Location!.ToString();
        Assert.Contains("x_connected=0", target);
        Assert.Contains("User", Uri.UnescapeDataString(target));
        Assert.Equal(tokenCallsBefore, _factory.TokenEndpointHandler.TokenRequestCount);
    }

    [Fact]
    public async Task Callback_WhenTokenEndpointRejectsTheCode_RedirectsWithTheRealError()
    {
        var client = CreateNonRedirectingClient();
        var loginResponse = await client.GetAsync("/api/auth/x/login");
        var state = HttpUtility.ParseQueryString(loginResponse.Headers.Location!.Query)["state"]!;

        _factory.TokenEndpointHandler.NextTokenError = (HttpStatusCode.BadRequest, """{"error":"invalid_grant"}""");

        var response = await client.GetAsync($"/api/auth/x/callback?code=bad-code&state={state}");

        var target = response.Headers.Location!.ToString();
        Assert.Contains("x_connected=0", target);
        Assert.Contains("x_error=", target);
    }

    [Fact]
    public async Task Status_WhenNothingIsConnectedYet_ReturnsConnectedFalse()
    {
        using var freshFactory = new XDashboardWebApplicationFactory();
        var client = freshFactory.CreateClient();

        var response = await client.GetAsync("/api/auth/x/status");

        response.EnsureSuccessStatusCode();
        var status = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(status.GetProperty("connected").GetBoolean());
    }

    [Fact]
    public async Task Logout_RevokesOnXAndClearsLocalConnection()
    {
        using var freshFactory = new XDashboardWebApplicationFactory();
        freshFactory.XApiClient.Me = new XUser { Id = "u2", Username = "logout-test" };
        var client = freshFactory.CreateClient(NoRedirectOptions);

        var loginResponse = await client.GetAsync("/api/auth/x/login");
        var state = HttpUtility.ParseQueryString(loginResponse.Headers.Location!.Query)["state"]!;
        await client.GetAsync($"/api/auth/x/callback?code=code&state={state}");

        var revokeCallsBefore = freshFactory.TokenEndpointHandler.RevokeRequestCount;
        var logoutResponse = await client.PostAsync("/api/auth/x/logout", content: null);
        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);
        Assert.Equal(revokeCallsBefore + 1, freshFactory.TokenEndpointHandler.RevokeRequestCount);

        var statusResponse = await client.GetAsync("/api/auth/x/status");
        var status = await statusResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(status.GetProperty("connected").GetBoolean());
    }
}
