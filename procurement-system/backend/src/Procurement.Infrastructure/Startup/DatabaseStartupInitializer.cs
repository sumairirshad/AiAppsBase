using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Procurement.Infrastructure.Persistence;
using Procurement.Infrastructure.Persistence.Seed;

namespace Procurement.Infrastructure.Startup;

public class DatabaseOptions
{
    public string ConnectionString { get; set; } = string.Empty;
    public bool SeedDemoData { get; set; } = true;
}

// The one place that satisfies the "create the database if missing, migrate, self-heal the
// schema, then seed" requirement. Call RunAsync once at startup, before the host starts
// accepting requests / processing jobs. Steps:
//   1. CREATE DATABASE if it doesn't exist yet (connects to master first).
//   2. sp_getapplock around everything below, so a second process (the Worker, or a second
//      API replica) starting at the same instant waits instead of racing this one.
//   3. Database.Migrate() - the primary, versioned mechanism.
//   4. SchemaReconciler - additive safety net for anything migrations didn't cover.
//   5. Idempotent seeders, in dependency order.
// Any failure aborts startup loudly rather than letting the app run against a half-correct
// schema; every step after 1 runs again, harmlessly, on every subsequent startup.
public class DatabaseStartupInitializer
{
    private readonly ProcurementDbContext _db;
    private readonly SchemaReconciler _reconciler;
    private readonly BootstrapSeeder _bootstrap;
    private readonly RoleSeeder _roles;
    private readonly PermissionSeeder _permissions;
    private readonly LookupSeeder _lookups;
    private readonly PolicySeeder _policy;
    private readonly WorkflowSeeder _workflow;
    private readonly SpendTaxonomySeeder _spendTaxonomy;
    private readonly DemoDataSeeder _demoData;
    private readonly DatabaseOptions _options;
    private readonly ILogger<DatabaseStartupInitializer> _logger;

    public DatabaseStartupInitializer(
        ProcurementDbContext db, SchemaReconciler reconciler, BootstrapSeeder bootstrap, RoleSeeder roles,
        PermissionSeeder permissions, LookupSeeder lookups, PolicySeeder policy, WorkflowSeeder workflow, SpendTaxonomySeeder spendTaxonomy,
        DemoDataSeeder demoData, IOptions<DatabaseOptions> options, ILogger<DatabaseStartupInitializer> logger)
    {
        _db = db;
        _reconciler = reconciler;
        _bootstrap = bootstrap;
        _roles = roles;
        _permissions = permissions;
        _lookups = lookups;
        _policy = policy;
        _workflow = workflow;
        _spendTaxonomy = spendTaxonomy;
        _demoData = demoData;
        _options = options.Value;
        _logger = logger;
    }

    public async Task RunAsync(CancellationToken ct = default)
    {
        _logger.LogInformation("Database startup: checking the database exists...");
        await EnsureDatabaseExistsAsync(ct);

        await _db.Database.OpenConnectionAsync(ct);
        try
        {
            await using var lockCmd = _db.Database.GetDbConnection().CreateCommand();
            lockCmd.CommandText = "EXEC sp_getapplock @Resource = 'ProcurementDbStartup', @LockMode = 'Exclusive', @LockOwner = 'Session', @LockTimeout = 120000;";
            await lockCmd.ExecuteNonQueryAsync(ct);
            _logger.LogInformation("Acquired startup lock.");

            _logger.LogInformation("Applying EF Core migrations...");
            await _db.Database.MigrateAsync(ct);

            _logger.LogInformation("Reconciling schema against the current model...");
            await _reconciler.ReconcileAsync(ct);

            _logger.LogInformation("Seeding...");
            var systemUserId = await _bootstrap.EnsureSystemUserAsync(ct);
            await _roles.SeedAsync(ct);
            await _permissions.SeedAsync(ct);
            await _lookups.SeedAsync(ct);
            if (_options.SeedDemoData) await _demoData.SeedDepartmentsAndLocationsAsync(systemUserId, ct);
            await _policy.SeedAsync(systemUserId, ct);
            await _workflow.SeedAsync(systemUserId, ct);
            await _spendTaxonomy.SeedAsync(ct);
            if (_options.SeedDemoData) await _demoData.SeedRemainingAsync(systemUserId, ct);

            _logger.LogInformation("Database startup complete.");
        }
        finally
        {
            await using var unlockCmd = _db.Database.GetDbConnection().CreateCommand();
            unlockCmd.CommandText = "EXEC sp_releaseapplock @Resource = 'ProcurementDbStartup', @LockOwner = 'Session';";
            try { await unlockCmd.ExecuteNonQueryAsync(ct); } catch { /* connection closing anyway */ }
            await _db.Database.CloseConnectionAsync();
        }
    }

    private async Task EnsureDatabaseExistsAsync(CancellationToken ct)
    {
        var builder = new SqlConnectionStringBuilder(_options.ConnectionString);
        var targetDb = builder.InitialCatalog;
        if (string.IsNullOrWhiteSpace(targetDb))
            throw new InvalidOperationException("Connection string has no Initial Catalog/Database set.");

        builder.InitialCatalog = "master";
        await using var connection = new SqlConnection(builder.ConnectionString);
        await connection.OpenAsync(ct);
        await using var cmd = connection.CreateCommand();
        cmd.CommandText = $"IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = @name) CREATE DATABASE [{targetDb}];";
        cmd.Parameters.AddWithValue("@name", targetDb);
        await cmd.ExecuteNonQueryAsync(ct);
    }
}

public static class DatabaseStartupExtensions
{
    public static async Task InitializeProcurementDatabaseAsync(this IHost host, CancellationToken ct = default)
    {
        using var scope = host.Services.CreateScope();
        var initializer = scope.ServiceProvider.GetRequiredService<DatabaseStartupInitializer>();
        await initializer.RunAsync(ct);
    }
}
