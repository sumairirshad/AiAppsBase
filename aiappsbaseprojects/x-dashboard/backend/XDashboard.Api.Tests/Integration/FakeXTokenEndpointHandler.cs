using System.Net;
using System.Net.Http.Headers;

namespace XDashboard.Api.Tests.Integration;

/// <summary>
/// Stands in for X's real token/revoke endpoints at the HTTP layer, so the integration tests
/// exercise XOAuthService's real request-building and InMemoryPendingAuthorizationStore's real
/// state/PKCE bookkeeping end to end, with only the actual network call to x.com faked out.
/// </summary>
public class FakeXTokenEndpointHandler : HttpMessageHandler
{
    /// <summary>When set, the next token request returns this status with this body instead of a
    /// successful token response -- simulates X rejecting an authorization code.</summary>
    public (HttpStatusCode Status, string Body)? NextTokenError { get; set; }

    public int TokenRequestCount { get; private set; }
    public int RevokeRequestCount { get; private set; }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (request.RequestUri!.AbsolutePath.EndsWith("/oauth2/revoke", StringComparison.Ordinal))
        {
            RevokeRequestCount++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        }

        TokenRequestCount++;

        if (NextTokenError is { } error)
        {
            NextTokenError = null;
            var errorResponse = new HttpResponseMessage(error.Status)
            {
                Content = new StringContent(error.Body),
            };
            return Task.FromResult(errorResponse);
        }

        var json = """
            {
              "access_token": "fake-access-token",
              "refresh_token": "fake-refresh-token",
              "expires_in": 7200,
              "scope": "tweet.read tweet.write users.read offline.access media.write",
              "token_type": "bearer"
            }
            """;
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(json),
        };
        response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
        return Task.FromResult(response);
    }
}
