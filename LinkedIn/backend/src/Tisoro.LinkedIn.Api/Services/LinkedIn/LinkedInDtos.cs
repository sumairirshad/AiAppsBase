using System.Text.Json.Serialization;

namespace Tisoro.LinkedIn.Api.Services.LinkedIn;

public sealed class LinkedInTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = "";

    [JsonPropertyName("expires_in")]
    public long ExpiresInSeconds { get; set; }

    [JsonPropertyName("refresh_token")]
    public string? RefreshToken { get; set; }

    [JsonPropertyName("refresh_token_expires_in")]
    public long? RefreshTokenExpiresInSeconds { get; set; }

    [JsonPropertyName("scope")]
    public string? Scope { get; set; }
}

public sealed class LinkedInUserInfo
{
    [JsonPropertyName("sub")]
    public string Sub { get; set; } = "";

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }
}

public sealed class AdministeredOrganization
{
    public string OrganizationUrn { get; set; } = "";
    public string? OrganizationName { get; set; }
}

/// <summary>What the caller wants published; LinkedInApiClient translates this into the correct LinkedIn Posts API shape per content type.</summary>
public sealed class PostPublishSpec
{
    public required string AuthorUrn { get; init; }
    public required Models.PostContentType ContentType { get; init; }
    public required string Body { get; init; }
    public string? Title { get; init; }
    public string? ExternalLinkUrl { get; init; }
    public IReadOnlyList<string> MediaUrns { get; init; } = Array.Empty<string>();
}
