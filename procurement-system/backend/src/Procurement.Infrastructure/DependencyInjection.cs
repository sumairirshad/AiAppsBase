using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Procurement.Application.Common.Interfaces;
using Procurement.Infrastructure.Persistence;
using Procurement.Infrastructure.Persistence.Seed;
using Procurement.Infrastructure.Services;
using Procurement.Infrastructure.Startup;

namespace Procurement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddProcurementInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("ProcurementDb")
            ?? configuration["ConnectionStrings:ProcurementDb"]
            ?? throw new InvalidOperationException("Connection string 'ProcurementDb' is not configured.");

        services.Configure<DatabaseOptions>(o =>
        {
            o.ConnectionString = connectionString;
            o.SeedDemoData = configuration.GetValue("SeedDemoData", true);
        });
        services.Configure<Services.JwtOptions>(configuration.GetSection("Jwt"));

        services.AddDbContext<ProcurementDbContext>(options =>
            options.UseSqlServer(connectionString, sql =>
            {
                sql.MigrationsHistoryTable("__EFMigrationsHistory");
                sql.EnableRetryOnFailure(5);
            }));

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ProcurementDbContext>());

        services.AddScoped<SchemaReconciler>();
        services.AddScoped<BootstrapSeeder>();
        services.AddScoped<RoleSeeder>();
        services.AddScoped<PermissionSeeder>();
        services.AddScoped<LookupSeeder>();
        services.AddScoped<PolicySeeder>();
        services.AddScoped<WorkflowSeeder>();
        services.AddScoped<SpendTaxonomySeeder>();
        services.AddScoped<DemoDataSeeder>();
        services.AddScoped<DatabaseStartupInitializer>();

        services.AddScoped<IDocumentNumberGenerator, DocumentNumberGenerator>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddSingleton<IFileStorageService, LocalFileStorageService>();
        services.AddSingleton<IEmailSender, SmtpEmailSender>();
        services.AddSingleton<IWhatsAppSender, LoggingWhatsAppSender>();
        services.AddHttpClient<IFinancePortalClient, FinancePortalClient>();

        return services;
    }
}
