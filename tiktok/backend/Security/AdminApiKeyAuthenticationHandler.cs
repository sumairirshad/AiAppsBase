using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using TikTok.Api.Configuration;

namespace TikTok.Api.Security;

public class AdminApiKeyAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "AdminApiKey";
    private const string HeaderName = "X-Admin-Api-Key";

    private readonly AppSecurityOptions _securityOptions;

    public AdminApiKeyAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IOptions<AppSecurityOptions> securityOptions) : base(options, logger, encoder)
    {
        _securityOptions = securityOptions.Value;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (string.IsNullOrWhiteSpace(_securityOptions.AdminApiKey))
        {
            return Task.FromResult(AuthenticateResult.Fail("Admin API key is not configured on the server."));
        }

        if (!Request.Headers.TryGetValue(HeaderName, out var provided) ||
            !CryptographicEquals(provided.ToString(), _securityOptions.AdminApiKey))
        {
            return Task.FromResult(AuthenticateResult.Fail("Missing or invalid admin API key."));
        }

        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, "operator") }, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }

    private static bool CryptographicEquals(string a, string b)
    {
        var aBytes = System.Text.Encoding.UTF8.GetBytes(a);
        var bBytes = System.Text.Encoding.UTF8.GetBytes(b);
        return aBytes.Length == bBytes.Length && System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(aBytes, bBytes);
    }
}
