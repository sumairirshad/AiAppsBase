using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Procurement.Application.Common.Interfaces;
using Procurement.Infrastructure.Auth;
using Procurement.Infrastructure.Persistence;
using Procurement.Infrastructure.Persistence.Seed;
using Procurement.Infrastructure.Storage;

namespace Procurement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddProcurementInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("ProcurementDb")
            ?? throw new InvalidOperationException("Connection string 'ProcurementDb' is not configured.");

        services.AddDbContext<ProcurementDbContext>(options =>
            options.UseSqlServer(connectionString, sql =>
            {
                sql.MigrationsAssembly(typeof(ProcurementDbContext).Assembly.FullName);
                sql.EnableRetryOnFailure();
            }).ReplaceService<Microsoft.EntityFrameworkCore.Migrations.IMigrationsSqlGenerator, IdempotentSqlServerMigrationsSqlGenerator>());

        services.AddScoped<IProcurementDbContext>(sp => sp.GetRequiredService<ProcurementDbContext>());
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserContext, CurrentUserContext>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IEncryptionService, AesEncryptionService>();
        services.AddSingleton<IFileStorageService, LocalFileStorageService>();

        return services;
    }

    public static async Task MigrateAndSeedProcurementDbAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ProcurementDbContext>();
        await db.Database.MigrateAsync();
        await DbSeeder.SeedAsync(db);
    }
}
