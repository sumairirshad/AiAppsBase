using System.Security.Claims;
using System.Text.Encodings.Web;
using Instagram.Api.Configuration;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Instagram.Api.Security;

public class AdminApiKeyAuthHandler(
    IOptionsMonitor<AdminApiKeyAuthOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IOptions<AdminAuthOptions> adminAuthOptions)
    : AuthenticationHandler<AdminApiKeyAuthOptions>(options, logger, encoder)
{
    private const string HeaderName = "X-Admin-Api-Key";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(HeaderName, out var providedKey))
        {
            return Task.FromResult(AuthenticateResult.Fail($"Missing {HeaderName} header."));
        }

        var expectedKey = adminAuthOptions.Value.ApiKey;
        var providedBytes = System.Text.Encoding.UTF8.GetBytes(providedKey.ToString());
        var expectedBytes = System.Text.Encoding.UTF8.GetBytes(expectedKey);

        var isValid = expectedBytes.Length > 0 &&
            providedBytes.Length == expectedBytes.Length &&
            System.Security.Cryptography.CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);

        if (!isValid)
        {
            return Task.FromResult(AuthenticateResult.Fail("Invalid API key."));
        }

        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, "admin-operator")],
            AdminApiKeyAuthOptions.SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, AdminApiKeyAuthOptions.SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
