namespace XDashboard.Api.Options;

/// <summary>
/// Configuration for the real X (Twitter) API v2 OAuth 2.0 Authorization Code + PKCE flow.
/// Populated from environment variables (see Program.cs), never from appsettings.json,
/// so real credentials never end up committed to source control.
/// </summary>
public class XApiOptions
{
    public const string SectionName = "XApi";

    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string CallbackUrl { get; set; } = string.Empty;

    /// <summary>
    /// Space-separated OAuth 2.0 scopes requested during authorization.
    /// offline.access is required to receive a refresh token.
    /// media.write is required to attach images/video to posts.
    /// </summary>
    public string Scopes { get; set; } =
        "tweet.read tweet.write users.read offline.access media.write";

    public string ApiBaseUrl { get; set; } = "https://api.x.com";
    public string AuthorizeUrl { get; set; } = "https://x.com/i/oauth2/authorize";
    public string TokenUrl { get; set; } = "https://api.x.com/2/oauth2/token";
    public string RevokeUrl { get; set; } = "https://api.x.com/2/oauth2/revoke";

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ClientId)
        && !string.IsNullOrWhiteSpace(ClientSecret)
        && !string.IsNullOrWhiteSpace(CallbackUrl);
}
