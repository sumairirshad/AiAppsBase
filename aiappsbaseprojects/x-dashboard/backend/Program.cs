using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http.Features;
using XDashboard.Api.Infrastructure;
using XDashboard.Api.Options;
using XDashboard.Api.Services.Abstractions;
using XDashboard.Api.Services.Real;
using XDashboard.Api.Services.Scheduling;
using XDashboard.Api.Services.X;

// Load backend/.env (if present) before anything reads configuration, the same way the
// frontend reads frontend/.env.local. Values the environment already has (e.g. set by the
// hosting platform) take priority and are never overwritten.
EnvFile.Load(Path.Combine(Directory.GetCurrentDirectory(), ".env"));

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- Configuration (environment variables only -- see backend/.env.example) ---
builder.Services.Configure<CorsOptions>(builder.Configuration.GetSection(CorsOptions.SectionName));
builder.Services.Configure<XApiOptions>(options =>
{
    options.ClientId = Environment.GetEnvironmentVariable("X_CLIENT_ID") ?? string.Empty;
    options.ClientSecret = Environment.GetEnvironmentVariable("X_CLIENT_SECRET") ?? string.Empty;
    options.CallbackUrl = Environment.GetEnvironmentVariable("X_CALLBACK_URL") ?? string.Empty;
    options.Scopes = Environment.GetEnvironmentVariable("X_OAUTH_SCOPES") is { Length: > 0 } scopes
        ? scopes
        : options.Scopes;
});
builder.Services.Configure<SecurityOptions>(options =>
{
    options.TokenEncryptionKey = Environment.GetEnvironmentVariable("TOKEN_ENCRYPTION_KEY") ?? string.Empty;
});
builder.Services.Configure<FrontendOptions>(options =>
{
    options.BaseUrl = Environment.GetEnvironmentVariable("FRONTEND_BASE_URL") is { Length: > 0 } url
        ? url
        : options.BaseUrl;
});

// Chunked video uploads (up to 512MB per X's limits) need a larger multipart body limit than
// the ASP.NET Core default of 128MB.
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 512L * 1024 * 1024;
});

// --- X OAuth / token plumbing ---
// Everything below is registered as a singleton (none of it holds per-request state -- each
// call carries its own ids/tokens through its parameters) so that InMemorySchedulerStore, which
// is itself necessarily a singleton (it's the one shared in-memory list of scheduled posts, and
// the background publisher needs to reach the same instance the controllers use), can depend on
// IPostStore without hitting ASP.NET Core's captive-dependency validation (a singleton may not
// consume a scoped service, even transitively).
builder.Services.AddSingleton<IPendingAuthorizationStore, InMemoryPendingAuthorizationStore>();
builder.Services.AddSingleton<ITokenStore, EncryptedInMemoryTokenStore>();
builder.Services.AddSingleton<IAccessTokenProvider, AccessTokenProvider>();
builder.Services.AddHttpClient<IXOAuthService, XOAuthService>();
builder.Services.AddHttpClient<IXApiClient, XApiClient>((sp, client) =>
{
    var xApiOptions = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<XApiOptions>>().Value;
    client.BaseAddress = new Uri(xApiOptions.ApiBaseUrl);
});

// --- App data stores: real X-backed implementations (no mock/fallback path) ---
builder.Services.AddSingleton<IProfileStore, RealProfileStore>();
builder.Services.AddSingleton<IPostStore, RealPostStore>();
builder.Services.AddSingleton<IShortStore, RealShortStore>();
builder.Services.AddSingleton<IPremiumStatusProvider, RealPremiumStatusProvider>();
builder.Services.AddSingleton<IDashboardService, RealDashboardService>();

// Scheduling is app-level state (the X API has no scheduling endpoint -- see
// InMemorySchedulerStore), so it stays a singleton in-memory store plus a background publisher.
builder.Services.AddSingleton<ISchedulerStore, InMemorySchedulerStore>();
builder.Services.AddHostedService<SchedulerPublishingService>();

var corsPolicyName = "XDashboardFrontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>()?.AllowedOrigins
            ?? Array.Empty<string>();

        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

ValidateRequiredConfiguration(app.Services, app.Environment);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(corsPolicyName);

app.UseMiddleware<ApiExceptionMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.Run();

static void ValidateRequiredConfiguration(IServiceProvider services, IWebHostEnvironment environment)
{
    var xApiOptions = services.GetRequiredService<Microsoft.Extensions.Options.IOptions<XApiOptions>>().Value;
    var securityOptions = services.GetRequiredService<Microsoft.Extensions.Options.IOptions<SecurityOptions>>().Value;

    var missing = new List<string>();
    if (string.IsNullOrWhiteSpace(xApiOptions.ClientId)) missing.Add("X_CLIENT_ID");
    if (string.IsNullOrWhiteSpace(xApiOptions.ClientSecret)) missing.Add("X_CLIENT_SECRET");
    if (string.IsNullOrWhiteSpace(xApiOptions.CallbackUrl)) missing.Add("X_CALLBACK_URL");
    if (string.IsNullOrWhiteSpace(securityOptions.TokenEncryptionKey)) missing.Add("TOKEN_ENCRYPTION_KEY");

    if (missing.Count == 0)
    {
        return;
    }

    var message =
        $"Missing required configuration: {string.Join(", ", missing)}.\n" +
        "This dashboard talks to the real X API and cannot start without real OAuth " +
        "credentials. Copy backend/.env.example to backend/.env, fill in the missing " +
        "values, and restart. See the project README for how to obtain X API credentials " +
        "and how to generate TOKEN_ENCRYPTION_KEY (`openssl rand -base64 32`).";

    throw new InvalidOperationException(message);
}
