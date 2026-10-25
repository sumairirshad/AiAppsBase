using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Polly;
using TikTok.Api.Clients;
using TikTok.Api.Configuration;
using TikTok.Api.Data;
using TikTok.Api.Security;
using TikTok.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<TikTokOptions>(builder.Configuration.GetSection(TikTokOptions.SectionName));
builder.Services.Configure<AppSecurityOptions>(builder.Configuration.GetSection(AppSecurityOptions.SectionName));
builder.Services.Configure<CorsOptions>(builder.Configuration.GetSection(CorsOptions.SectionName));

builder.Services.AddDbContext<TikTokDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDataProtection();

builder.Services.AddSingleton<IOAuthStateStore, OAuthStateStore>();
builder.Services.AddSingleton<ITokenProtector, DataProtectionTokenProtector>();
builder.Services.AddScoped<IAccountConnectionService, AccountConnectionService>();
builder.Services.AddScoped<IPublishingService, PublishingService>();
builder.Services.AddScoped<IStatsService, StatsService>();
builder.Services.AddHostedService<PublishingBackgroundWorker>();

builder.Services.AddHttpClient<ITikTokApiClient, TikTokApiClient>()
    .AddTransientHttpErrorPolicy(policy => policy.WaitAndRetryAsync(3, attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt))));

builder.Services.AddAuthentication(AdminApiKeyAuthenticationHandler.SchemeName)
    .AddScheme<AuthenticationSchemeOptions, AdminApiKeyAuthenticationHandler>(AdminApiKeyAuthenticationHandler.SchemeName, null);
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ConfiguredOrigins", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>()?.AllowedOrigins
            ?? Array.Empty<string>();
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(opts => opts.SuppressModelStateInvalidFilter = false);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseCors("ConfiguredOrigins");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "tiktok-api", timeUtc = DateTimeOffset.UtcNow }))
    .AllowAnonymous();

app.MapControllers();

app.Run();

public partial class Program
{
}
