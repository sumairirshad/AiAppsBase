namespace Instagram.Api.Configuration;

public class InstagramApiOptions
{
    public const string SectionName = "InstagramApi";

    public required string ClientId { get; set; }
    public required string ClientSecret { get; set; }
    public required string RedirectUri { get; set; }
    public string AuthorizationBaseUrl { get; set; } = "https://www.instagram.com/oauth/authorize";
    public string TokenExchangeUrl { get; set; } = "https://api.instagram.com/oauth/access_token";
    public string GraphApiBaseUrl { get; set; } = "https://graph.instagram.com";
    public string GraphApiVersion { get; set; } = "v21.0";
    public string[] Scopes { get; set; } =
    [
        "instagram_business_basic",
        "instagram_business_content_publish",
        "instagram_business_manage_comments",
        "instagram_business_manage_insights"
    ];
}
