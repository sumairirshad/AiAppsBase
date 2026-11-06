using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Infrastructure.Persistence.Seed;

// Idempotent: upserts every lookup row by Code. Safe to run on every startup - matching rows
// are left alone (except Name/SortOrder, kept in sync with the spec), nothing is ever deleted
// here so a manually-added custom lookup value survives.
//
// The table name interpolated into these MERGE statements is never user input - it only ever
// comes from the fixed, generator-produced list in LookupSeedData.All(), so EF1002 doesn't
// apply here; every actual value is still passed as a SqlParameter.
#pragma warning disable EF1002
public class LookupSeeder
{
    // Matches the lookupTerminal() calls in tools/schema/schema.js.
    private static readonly HashSet<string> TerminalTables = new(StringComparer.OrdinalIgnoreCase)
    {
        "PrStatuses", "PoStatuses", "VendorStatuses", "ApprovalRequestStatuses",
        "TaskStatuses", "QueryStatuses", "SecurityDepositStatuses", "MonthEndAuditStatuses",
    };

    private readonly ProcurementDbContext _db;
    private readonly ILogger<LookupSeeder> _logger;

    public LookupSeeder(ProcurementDbContext db, ILogger<LookupSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        foreach (var lookup in LookupSeedData.All())
        {
            var hasTerminal = TerminalTables.Contains(lookup.TableName);
            foreach (var row in lookup.Rows)
            {
                if (hasTerminal)
                {
                    await _db.Database.ExecuteSqlRawAsync(
                        $"""
                        MERGE [{lookup.TableName}] AS target
                        USING (SELECT @code AS Code) AS src ON target.Code = src.Code
                        WHEN MATCHED THEN UPDATE SET Name = @name, SortOrder = @sortOrder, IsTerminal = @isTerminal
                        WHEN NOT MATCHED THEN INSERT (Code, Name, SortOrder, IsActive, IsTerminal)
                            VALUES (@code, @name, @sortOrder, 1, @isTerminal);
                        """,
                        new object[]
                        {
                            new Microsoft.Data.SqlClient.SqlParameter("@code", row.Code),
                            new Microsoft.Data.SqlClient.SqlParameter("@name", row.Name),
                            new Microsoft.Data.SqlClient.SqlParameter("@sortOrder", row.SortOrder),
                            new Microsoft.Data.SqlClient.SqlParameter("@isTerminal", row.IsTerminal),
                        }, ct);
                }
                else
                {
                    await _db.Database.ExecuteSqlRawAsync(
                        $"""
                        MERGE [{lookup.TableName}] AS target
                        USING (SELECT @code AS Code) AS src ON target.Code = src.Code
                        WHEN MATCHED THEN UPDATE SET Name = @name, SortOrder = @sortOrder
                        WHEN NOT MATCHED THEN INSERT (Code, Name, SortOrder, IsActive)
                            VALUES (@code, @name, @sortOrder, 1);
                        """,
                        new object[]
                        {
                            new Microsoft.Data.SqlClient.SqlParameter("@code", row.Code),
                            new Microsoft.Data.SqlClient.SqlParameter("@name", row.Name),
                            new Microsoft.Data.SqlClient.SqlParameter("@sortOrder", row.SortOrder),
                        }, ct);
                }
            }
            _logger.LogInformation("Seeded lookup {Table} ({Count} rows)", lookup.TableName, lookup.Rows.Length);
        }

        await _db.Database.ExecuteSqlRawAsync(
            """
            MERGE [Currencies] AS target
            USING (VALUES ('PKR','Pakistani Rupee'), ('USD','US Dollar'), ('AED','UAE Dirham')) AS src (Code, Name)
            ON target.Code = src.Code
            WHEN MATCHED THEN UPDATE SET Name = src.Name
            WHEN NOT MATCHED THEN INSERT (Code, Name, IsActive) VALUES (src.Code, src.Name, 1);
            """, ct);
    }
}
#pragma warning restore EF1002
