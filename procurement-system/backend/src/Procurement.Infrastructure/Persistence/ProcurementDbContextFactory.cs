using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Procurement.Infrastructure.Persistence;

// Used only by `dotnet ef migrations add/script` at design time - never by the running app,
// which gets its connection string from configuration via DI (see AddProcurementInfrastructure).
public class ProcurementDbContextFactory : IDesignTimeDbContextFactory<ProcurementDbContext>
{
    public ProcurementDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("PROCUREMENT_CONNECTION_STRING")
            ?? "Server=localhost;Database=ProcurementDb;User Id=sa;Password=Design_Time_Only!;TrustServerCertificate=True;";

        var optionsBuilder = new DbContextOptionsBuilder<ProcurementDbContext>();
        optionsBuilder.UseSqlServer(connectionString, sql => sql.MigrationsHistoryTable("__EFMigrationsHistory"));
        return new ProcurementDbContext(optionsBuilder.Options);
    }
}
