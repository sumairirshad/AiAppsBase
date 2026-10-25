namespace Instagram.Api.Configuration;

public class AdminAuthOptions
{
    public const string SectionName = "AdminAuth";

    public required string ApiKey { get; set; }
}
