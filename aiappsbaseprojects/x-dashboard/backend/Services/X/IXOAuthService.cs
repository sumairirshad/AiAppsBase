namespace XDashboard.Api.Services.X;

public record AuthorizationRequest(string AuthorizeUrl, string State);

public interface IXOAuthService
{
    /// <summary>Builds the X authorize URL for a new login attempt and records the PKCE
    /// verifier server-side so the callback can complete the exchange.</summary>
    AuthorizationRequest BeginAuthorization();

    /// <summary>Exchanges an authorization code (from the callback) for an access/refresh
    /// token pair. Throws if `state` does not match a pending authorization.</summary>
    Task<XTokenSet> CompleteAuthorizationAsync(string code, string state, CancellationToken cancellationToken = default);

    Task<XTokenSet> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default);

    Task RevokeAsync(string accessToken, CancellationToken cancellationToken = default);
}
