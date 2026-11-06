using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

// The 8 roles are fixed by the spec: one role per job, never one per department (HOD is
// scoped to a department via UserRoleAssignments, not by having its own role per department).
public class RoleSeeder
{
    public static readonly (string Code, string Name)[] Defaults =
    {
        ("REQUESTOR", "Requestor"),
        ("HOD", "Head of Department"),
        ("PROCUREMENT", "Procurement"),
        ("FINANCE", "Finance"),
        ("AUDIT", "Audit"),
        ("OPD", "OPD"),
        ("SYSADMIN", "System Administrator"),
        ("SYSTEM", "System"),
    };

    private readonly ProcurementDbContext _db;
    private readonly ILogger<RoleSeeder> _logger;

    public RoleSeeder(ProcurementDbContext db, ILogger<RoleSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        var existing = await _db.Roles.Select(r => r.Code).ToListAsync(ct);
        foreach (var (code, name) in Defaults)
        {
            if (existing.Contains(code)) continue;
            _db.Roles.Add(new Roles { Code = code, Name = name });
        }
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Seeded roles.");
    }
}
