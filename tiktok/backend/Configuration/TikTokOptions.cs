namespace TikTok.Api.Configuration;

public class TikTokOptions
{
    public const string SectionName = "TikTok";

    public string ClientKey { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
    public string AuthorizeUrl { get; set; } = "https://www.tiktok.com/v2/auth/authorize/";
    public string TokenUrl { get; set; } = "https://open.tiktokapis.com/v2/oauth/token/";
    public string ApiBaseUrl { get; set; } = "https://open.tiktokapis.com";
    public string Scopes { get; set; } = "user.info.basic,user.info.profile,user.info.stats,video.publish,video.upload,video.list";
}

public class AppSecurityOptions
{
    public const string SectionName = "AppSecurity";

    public string AdminApiKey { get; set; } = string.Empty;
    public string TokenEncryptionPurpose { get; set; } = "TikTok.Api.TokenProtection.v1";
}

public class CorsOptions
{
    public const string SectionName = "Cors";

    public string[] AllowedOrigins { get; set; } = Array.Empty<string>();
}
