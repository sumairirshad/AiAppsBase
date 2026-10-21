namespace Tisoro.LinkedIn.Api.Configuration;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    /// <summary>Must be at least 32 bytes. Set via JWT_SIGNING_KEY.</summary>
    public string SigningKey { get; set; } = "";
    public string Issuer { get; set; } = "tisoro-linkedin-api";
    public string Audience { get; set; } = "tisoro-linkedin-frontend";
    public int AccessTokenMinutes { get; set; } = 60 * 8;
}

public sealed class TokenEncryptionOptions
{
    public const string SectionName = "TokenEncryption";

    /// <summary>Encryption key for third-party secrets (LinkedIn tokens) at rest. Set via TOKEN_ENCRYPTION_KEY.</summary>
    public string Key { get; set; } = "";
}

public sealed class LinkedInOptions
{
    public const string SectionName = "LinkedIn";

    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";

    /// <summary>Must exactly match a redirect URL registered on the LinkedIn app.</summary>
    public string RedirectUri { get; set; } = "";

    /// <summary>Space-separated OAuth scopes requested at connect time.</summary>
    public string Scopes { get; set; } = "openid profile w_member_social w_organization_social rw_organization_admin";

    public string ApiVersion { get; set; } = "202410";

    public string AuthorizeBaseUrl { get; set; } = "https://www.linkedin.com/oauth/v2/authorization";
    public string TokenUrl { get; set; } = "https://www.linkedin.com/oauth/v2/accessToken";
    public string ApiBaseUrl { get; set; } = "https://api.linkedin.com";
}

public sealed class InitialAdminOptions
{
    public const string SectionName = "InitialAdmin";

    /// <summary>If set, and no admin users exist yet, one is seeded at startup from these values.</summary>
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? FullName { get; set; }
}

public sealed class MediaStorageOptions
{
    public const string SectionName = "MediaStorage";

    /// <summary>Local directory uploaded media is written to before being pushed to LinkedIn at publish time.</summary>
    public string RootPath { get; set; } = "App_Data/media";

    public long MaxUploadBytes { get; set; } = 500L * 1024 * 1024;
}

public sealed class PublishingOptions
{
    public const string SectionName = "Publishing";

    public int PollIntervalSeconds { get; set; } = 60;
    public int MaxAttempts { get; set; } = 3;
}

public sealed class CorsOptions
{
    public const string SectionName = "Cors";

    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}

public sealed class GeneralOptions
{
    public const string SectionName = "General";

    /// <summary>Where the browser is sent back to after the LinkedIn OAuth callback completes.</summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:3000";
}
