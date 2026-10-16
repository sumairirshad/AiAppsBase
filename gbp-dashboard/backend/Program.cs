using System.Text.Json.Serialization;
using GbpDashboard.Api.Options;
using GbpDashboard.Api.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<MockDataSettings>(builder.Configuration.GetSection(MockDataSettings.SectionName));
builder.Services.Configure<GoogleBusinessProfileOptions>(builder.Configuration.GetSection(GoogleBusinessProfileOptions.SectionName));
builder.Services.Configure<CorsSettings>(builder.Configuration.GetSection(CorsSettings.SectionName));

var corsSettings = builder.Configuration.GetSection(CorsSettings.SectionName).Get<CorsSettings>() ?? new CorsSettings();
const string FrontendCorsPolicy = "FrontendCorsPolicy";

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy.WithOrigins(corsSettings.AllowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddSingleton<IBusinessProfileRepository, InMemoryBusinessProfileRepository>();
builder.Services.AddSingleton<IPostRepository, InMemoryPostRepository>();
builder.Services.AddSingleton<IMediaRepository, InMemoryMediaRepository>();

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(FrontendCorsPolicy);

app.UseAuthorization();

app.MapControllers();

app.Run();
