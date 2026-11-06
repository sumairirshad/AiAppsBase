using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Procurement.Infrastructure.Persistence.Seed;

// Users.DepartmentId and Departments.CreatedBy are each mandatory FKs into the other table,
// so the very first row of each is a one-time chicken-and-egg bootstrap: temporarily disable
// constraint checking, insert both self/mutually-referencing rows with explicit Ids, then
// re-validate (WITH CHECK CHECK CONSTRAINT) so every constraint is enforced again from this
// point on. Runs once; every later seeder just uses the Ids this returns.
public class BootstrapSeeder
{
    public const long SystemDepartmentId = 1;
    public const long SystemUserId = 1;

    private readonly ProcurementDbContext _db;
    private readonly ILogger<BootstrapSeeder> _logger;

    public BootstrapSeeder(ProcurementDbContext db, ILogger<BootstrapSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<long> EnsureSystemUserAsync(CancellationToken ct = default)
    {
        var alreadyThere = await _db.Users.AnyAsync(ct);
        if (alreadyThere)
        {
            var existing = await _db.Users.OrderBy(u => u.Id).FirstAsync(ct);
            return existing.Id;
        }

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        await _db.Database.ExecuteSqlRawAsync("ALTER TABLE [Departments] NOCHECK CONSTRAINT ALL;", ct);
        await _db.Database.ExecuteSqlRawAsync("ALTER TABLE [Users] NOCHECK CONSTRAINT ALL;", ct);

        await _db.Database.ExecuteSqlRawAsync(
            $"""
            SET IDENTITY_INSERT [Departments] ON;
            INSERT INTO [Departments] (Id, Code, Name, IsActive, CreatedAt, CreatedBy)
                VALUES ({SystemDepartmentId}, 'SYS', 'System', 1, SYSUTCDATETIME(), {SystemUserId});
            SET IDENTITY_INSERT [Departments] OFF;
            """, ct);

        await _db.Database.ExecuteSqlRawAsync(
            $"""
            SET IDENTITY_INSERT [Users] ON;
            INSERT INTO [Users] (Id, EmployeeNo, DisplayName, Email, DepartmentId, IsActive, CreatedAt, CreatedBy)
                VALUES ({SystemUserId}, 'SYS-0001', 'System', 'system@procurement.local', {SystemDepartmentId}, 1, SYSUTCDATETIME(), {SystemUserId});
            SET IDENTITY_INSERT [Users] OFF;
            """, ct);

        await _db.Database.ExecuteSqlRawAsync("ALTER TABLE [Departments] WITH CHECK CHECK CONSTRAINT ALL;", ct);
        await _db.Database.ExecuteSqlRawAsync("ALTER TABLE [Users] WITH CHECK CHECK CONSTRAINT ALL;", ct);
        await tx.CommitAsync(ct);

        _logger.LogInformation("Bootstrapped the SYSTEM department and user.");
        return SystemUserId;
    }
}
