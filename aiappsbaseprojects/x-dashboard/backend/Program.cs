using System.Text.Json.Serialization;
using XDashboard.Api.Options;
using XDashboard.Api.Services.Abstractions;
using XDashboard.Api.Services.Mock;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.Configure<MockDataOptions>(builder.Configuration.GetSection(MockDataOptions.SectionName));
builder.Services.Configure<CorsOptions>(builder.Configuration.GetSection(CorsOptions.SectionName));

builder.Services.AddSingleton<SeedDataLoader>();
builder.Services.AddSingleton<IProfileStore, InMemoryProfileStore>();
builder.Services.AddSingleton<IPostStore, InMemoryPostStore>();
builder.Services.AddSingleton<IShortStore, InMemoryShortStore>();
builder.Services.AddSingleton<ISchedulerStore, InMemorySchedulerStore>();
builder.Services.AddSingleton<IPremiumStatusProvider, MockPremiumStatusProvider>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(corsPolicyName);

app.UseAuthorization();

app.MapControllers();

app.Run();
