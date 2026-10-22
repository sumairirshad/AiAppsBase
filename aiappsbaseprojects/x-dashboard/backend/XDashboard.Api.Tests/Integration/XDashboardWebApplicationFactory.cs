using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using XDashboard.Api.Services.Abstractions;
using XDashboard.Api.Services.X;
using XDashboard.Api.Tests.Fakes;

namespace XDashboard.Api.Tests.Integration;

/// <summary>
/// Boots the real app (real Program.cs, real routing, real exception middleware, real OAuth
/// state/PKCE bookkeeping, real AES-256-GCM token encryption) with only the actual network calls
/// to X faked out: the X data stores are swapped for the project's own hand-written Fakes, and
/// the OAuth token-endpoint HTTP client gets a fake handler (<see cref="TokenEndpointHandler"/>)
/// instead of a real connection to x.com. No credentials this test suite holds are real; X_CLIENT_ID
/// etc. are fixed placeholder strings that only need to be non-empty to satisfy Program.cs's
/// own startup validation.
///
/// Program.cs reads X_CLIENT_ID/X_CLIENT_SECRET/X_CALLBACK_URL/TOKEN_ENCRYPTION_KEY directly from
/// the process environment (by design -- see Program.cs's own comment), not from
/// IConfiguration/appsettings, so these have to be real process environment variables, set before
/// the host is built.
/// </summary>
public sealed class XDashboardWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string CallbackUrl = "http://localhost/api/auth/x/callback";

    public FakeXApiClient XApiClient { get; } = new();
    public FakePostStore PostStore { get; } = new();
    public FakeShortStore ShortStore { get; } = new();
    public FakePremiumStatusProvider PremiumStatusProvider { get; } = new();
    public FakeXTokenEndpointHandler TokenEndpointHandler { get; } = new();

    public XDashboardWebApplicationFactory()
    {
        Environment.SetEnvironmentVariable("X_CLIENT_ID", "test-client-id");
        Environment.SetEnvironmentVariable("X_CLIENT_SECRET", "test-client-secret");
        Environment.SetEnvironmentVariable("X_CALLBACK_URL", CallbackUrl);
        Environment.SetEnvironmentVariable("TOKEN_ENCRYPTION_KEY", Convert.ToBase64String(new byte[32]));
        Environment.SetEnvironmentVariable("FRONTEND_BASE_URL", "http://localhost:3000");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.Replace(ServiceDescriptor.Singleton<IXApiClient>(XApiClient));
            services.Replace(ServiceDescriptor.Singleton<IPostStore>(PostStore));
            services.Replace(ServiceDescriptor.Singleton<IShortStore>(ShortStore));
            services.Replace(ServiceDescriptor.Singleton<IPremiumStatusProvider>(PremiumStatusProvider));

            // Keep the real XOAuthService (so PKCE/state handling is genuinely exercised) but
            // redirect its HttpClient at the fake handler instead of the real x.com endpoints.
            services.AddHttpClient<IXOAuthService, XOAuthService>()
                .ConfigurePrimaryHttpMessageHandler(() => TokenEndpointHandler);
        });
    }
}
