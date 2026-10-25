using Microsoft.AspNetCore.Authentication;

namespace Instagram.Api.Security;

public class AdminApiKeyAuthOptions : AuthenticationSchemeOptions
{
    public const string SchemeName = "AdminApiKey";
}
