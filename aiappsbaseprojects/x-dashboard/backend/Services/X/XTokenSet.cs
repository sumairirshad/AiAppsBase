namespace XDashboard.Api.Services.X;

/// <summary>
/// An OAuth 2.0 token pair for the connected X account, plus enough metadata to know when the
/// access token needs refreshing.
/// </summary>
public class XTokenSet
{
    public required string AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public string Scope { get; set; } = string.Empty;

    /// <summary>True once the access token is within its last minute of life or already expired.</summary>
    public bool NeedsRefresh => DateTimeOffset.UtcNow >= ExpiresAt - TimeSpan.FromMinutes(1);
}
