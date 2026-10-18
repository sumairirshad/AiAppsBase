using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Web;
using Microsoft.Extensions.Options;
using XDashboard.Api.Options;

namespace XDashboard.Api.Services.X;

/// <summary>
/// Implements the X API v2 OAuth 2.0 Authorization Code grant with PKCE, as documented at
/// https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code
/// This app registers as a confidential (server-side) client, so the client secret is sent via
/// HTTP Basic auth on the token endpoint rather than relying on PKCE alone for client auth.
/// </summary>
public class XOAuthService : IXOAuthService
{
    private readonly HttpClient _httpClient;
    private readonly XApiOptions _options;
    private readonly IPendingAuthorizationStore _pendingAuthorizations;

    public XOAuthService(
        HttpClient httpClient,
        IOptions<XApiOptions> options,
        IPendingAuthorizationStore pendingAuthorizations)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _pendingAuthorizations = pendingAuthorizations;
    }

    public AuthorizationRequest BeginAuthorization()
    {
        RequireConfigured();

        var state = PkceGenerator.GenerateState();
        var codeVerifier = PkceGenerator.GenerateCodeVerifier();
        var codeChallenge = PkceGenerator.DeriveCodeChallenge(codeVerifier);

        _pendingAuthorizations.Add(new PendingAuthorization
        {
            State = state,
            CodeVerifier = codeVerifier,
        });

        var query = HttpUtility.ParseQueryString(string.Empty);
        query["response_type"] = "code";
        query["client_id"] = _options.ClientId;
        query["redirect_uri"] = _options.CallbackUrl;
        query["scope"] = _options.Scopes;
        query["state"] = state;
        query["code_challenge"] = codeChallenge;
        query["code_challenge_method"] = "S256";

        var authorizeUrl = $"{_options.AuthorizeUrl}?{query}";
        return new AuthorizationRequest(authorizeUrl, state);
    }

    public async Task<XTokenSet> CompleteAuthorizationAsync(string code, string state, CancellationToken cancellationToken = default)
    {
        RequireConfigured();

        var pending = _pendingAuthorizations.TakeByState(state)
            ?? throw new InvalidOperationException(
                "Unknown or expired authorization state. Start the X connection flow again.");

        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["redirect_uri"] = _options.CallbackUrl,
            ["code_verifier"] = pending.CodeVerifier,
            ["client_id"] = _options.ClientId,
        };

        return await RequestTokenAsync(form, cancellationToken);
    }

    public async Task<XTokenSet> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        RequireConfigured();

        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = refreshToken,
            ["client_id"] = _options.ClientId,
        };

        return await RequestTokenAsync(form, cancellationToken);
    }

    public async Task RevokeAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        if (!_options.IsConfigured)
        {
            return;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, _options.RevokeUrl)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["token"] = accessToken,
                ["client_id"] = _options.ClientId,
                ["token_type_hint"] = "access_token",
            }),
        };
        ApplyBasicAuth(request);

        // Best-effort: if X is unreachable or the token is already invalid, there is nothing
        // more we can do server-side. The local token store is cleared by the caller regardless.
        try
        {
            await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException)
        {
        }
    }

    private async Task<XTokenSet> RequestTokenAsync(Dictionary<string, string> form, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, _options.TokenUrl)
        {
            Content = new FormUrlEncodedContent(form),
        };
        ApplyBasicAuth(request);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new XApiException(
                response.StatusCode,
                $"X token endpoint returned {(int)response.StatusCode}: {body}");
        }

        var payload = JsonSerializer.Deserialize<TokenResponse>(body)
            ?? throw new XApiException(response.StatusCode, "X token endpoint returned an empty response.");

        return new XTokenSet
        {
            AccessToken = payload.AccessToken,
            RefreshToken = payload.RefreshToken,
            ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(payload.ExpiresIn),
            Scope = payload.Scope ?? _options.Scopes,
        };
    }

    private void ApplyBasicAuth(HttpRequestMessage request)
    {
        var credentials = Convert.ToBase64String(
            Encoding.ASCII.GetBytes($"{_options.ClientId}:{_options.ClientSecret}"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
    }

    private void RequireConfigured()
    {
        if (!_options.IsConfigured)
        {
            throw new InvalidOperationException(
                "X API OAuth is not configured. Set X_CLIENT_ID, X_CLIENT_SECRET and " +
                "X_CALLBACK_URL. See backend/.env.example.");
        }
    }

    private class TokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("scope")]
        public string? Scope { get; set; }

        [JsonPropertyName("token_type")]
        public string? TokenType { get; set; }
    }
}
