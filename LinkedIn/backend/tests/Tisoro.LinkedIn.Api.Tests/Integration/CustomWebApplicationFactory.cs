using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Tisoro.LinkedIn.Api.Tests.Integration;

/// <summary>
/// Boots the real app (real Program.cs, real middleware pipeline, real
/// migrations-and-seed startup step) against a dedicated Postgres test
/// database, so these tests exercise the same code path a production
/// deployment runs rather than a simplified stand-in.
///
/// Requires a reachable Postgres instance. Connection string comes from the
/// INTEGRATION_TEST_DB_CONNECTION env var, defaulting to a local database
/// named tisoro_linkedin_test (see the project README's "Running tests"
/// section for how to create it).
/// </summary>
public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string AdminEmail = "integration-admin@tisoroglobal.com";
    public const string AdminPassword = "IntegrationTestPassword123!";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        var connectionString = Environment.GetEnvironmentVariable("INTEGRATION_TEST_DB_CONNECTION")
            ?? "Host=localhost;Port=5432;Database=tisoro_linkedin_test;Username=postgres;Password=postgres";

        builder.UseSetting("ConnectionStrings:Default", connectionString);
        builder.UseSetting("Jwt:SigningKey", "integration-test-signing-key-at-least-32-bytes-long");
        builder.UseSetting("TokenEncryption:Key", "integration-test-token-encryption-key");
        builder.UseSetting("LinkedIn:ClientId", "test-client-id");
        builder.UseSetting("LinkedIn:ClientSecret", "test-client-secret");
        builder.UseSetting("LinkedIn:RedirectUri", "http://localhost/api/linkedin/callback");
        builder.UseSetting("InitialAdmin:Email", AdminEmail);
        builder.UseSetting("InitialAdmin:Password", AdminPassword);
        builder.UseSetting("InitialAdmin:FullName", "Integration Test Admin");
        builder.UseSetting("MediaStorage:RootPath", Path.Combine(Path.GetTempPath(), "tisoro-linkedin-test-media"));

        builder.UseEnvironment("Testing");
    }
}
