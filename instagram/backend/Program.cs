using Instagram.Api.BackgroundServices;
using Instagram.Api.Clients;
using Instagram.Api.Common;
using Instagram.Api.Configuration;
using Instagram.Api.Data;
using Instagram.Api.Security;
using Instagram.Api.Services;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<InstagramApiOptions>(
    builder.Configuration.GetSection(InstagramApiOptions.SectionName));
builder.Services.Configure<AdminAuthOptions>(
    builder.Configuration.GetSection(AdminAuthOptions.SectionName));
builder.Services.Configure<CorsOptions>(
    builder.Configuration.GetSection(CorsOptions.SectionName));
builder.Services.Configure<PublishingWorkerOptions>(
    builder.Configuration.GetSection(PublishingWorkerOptions.SectionName));

builder.Services.AddDbContext<InstagramDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(
        builder.Configuration["DataProtection:KeyRingPath"] ?? "./keys"))
    .SetApplicationName("Instagram.Api");

builder.Services.AddMemoryCache();

builder.Services.AddHttpClient<IInstagramGraphClient, InstagramGraphClient>()
    .AddHttpMessageHandler<RetryHandler>();
builder.Services.AddTransient<RetryHandler>();

builder.Services.AddScoped<ITokenProtector, DataProtectionTokenProtector>();
builder.Services.AddScoped<IOAuthStateService, OAuthStateService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<IPublishingOrchestrator, PublishingOrchestrator>();
builder.Services.AddScoped<IPublishingJobService, PublishingJobService>();
builder.Services.AddScoped<IInsightsService, InsightsService>();
builder.Services.AddScoped<ICommentModerationService, CommentModerationService>();

builder.Services.AddHostedService<ScheduledPublishingWorker>();

builder.Services.AddAuthentication(AdminApiKeyAuthOptions.SchemeName)
    .AddScheme<AdminApiKeyAuthOptions, AdminApiKeyAuthHandler>(AdminApiKeyAuthOptions.SchemeName, _ => { });
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ConfiguredOrigins", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection(CorsOptions.SectionName + ":AllowedOrigins").Get<string[]>()
            ?? [];
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("ConfiguredOrigins");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program;
