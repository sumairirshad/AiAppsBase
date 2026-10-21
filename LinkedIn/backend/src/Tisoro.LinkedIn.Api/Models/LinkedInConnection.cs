namespace Tisoro.LinkedIn.Api.Models;

/// <summary>
/// The single Tisoro Global LinkedIn Page connection this app publishes
/// through. Tokens are stored encrypted at rest (see TokenEncryptionService)
/// and are never returned to the frontend or logged.
/// </summary>
public sealed class LinkedInConnection
{
    public Guid Id { get; set; }

    public string OrganizationUrn { get; set; } = "";
    public string OrganizationName { get; set; } = "";
    public string MemberUrn { get; set; } = "";
    public string ConnectedByAdminEmail { get; set; } = "";

    public string AccessTokenEncrypted { get; set; } = "";
    public string? RefreshTokenEncrypted { get; set; }
    public string Scopes { get; set; } = "";

    public DateTimeOffset AccessTokenExpiresAt { get; set; }
    public DateTimeOffset? RefreshTokenExpiresAt { get; set; }

    public DateTimeOffset ConnectedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsActive { get; set; } = true;
}
