namespace Tisoro.LinkedIn.Api.Dtos;

public sealed class LinkedInConnectUrlResponse
{
    public string AuthorizeUrl { get; set; } = "";
}

public sealed class LinkedInStatusResponse
{
    public bool Connected { get; set; }
    public string? OrganizationName { get; set; }
    public string? OrganizationUrn { get; set; }
    public string? ConnectedByAdminEmail { get; set; }
    public DateTimeOffset? ConnectedAt { get; set; }
    public DateTimeOffset? AccessTokenExpiresAt { get; set; }
    public bool TokenExpired { get; set; }
}
