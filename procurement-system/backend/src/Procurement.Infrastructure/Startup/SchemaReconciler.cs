using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.Extensions.Logging;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Infrastructure.Startup;

// The self-healing safety net the user asked for: after Database.Migrate() has applied every
// pending EF Core migration, this compares what the current EF model actually expects against
// the live INFORMATION_SCHEMA and issues additive repairs for anything migrations didn't
// already cover - a table dropped out from under the app, a column missing because a migration
// was skipped or a previous deploy only partially ran, etc. It never drops or narrows
// anything, so it is safe to run on every single startup; when the schema already matches
// (the normal case once migrations are up to date) every check here is a no-op.
public class SchemaReconciler
{
    private readonly ProcurementDbContext _db;
    private readonly ILogger<SchemaReconciler> _logger;

    public SchemaReconciler(ProcurementDbContext db, ILogger<SchemaReconciler> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task ReconcileAsync(CancellationToken ct = default)
    {
        var existingTables = await LoadExistingTablesAsync(ct);

        foreach (var entityType in _db.Model.GetEntityTypes())
        {
            var tableName = entityType.GetTableName();
            if (tableName is null) continue;

            if (!existingTables.TryGetValue(tableName, out var existingColumns))
            {
                await CreateTableAsync(entityType, ct);
                existingColumns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                existingTables[tableName] = existingColumns;
            }

            foreach (var property in entityType.GetProperties())
            {
                var columnName = property.GetColumnName();
                if (existingColumns.Contains(columnName)) continue;

                await AddColumnAsync(tableName, property, ct);
                existingColumns.Add(columnName);
            }
        }
    }

    private async Task<Dictionary<string, HashSet<string>>> LoadExistingTablesAsync(CancellationToken ct)
    {
        var result = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);
        await using var cmd = _db.Database.GetDbConnection().CreateCommand();
        await EnsureOpenAsync(ct);
        cmd.CommandText = """
            SELECT t.TABLE_NAME, c.COLUMN_NAME
            FROM INFORMATION_SCHEMA.TABLES t
            JOIN INFORMATION_SCHEMA.COLUMNS c ON c.TABLE_NAME = t.TABLE_NAME AND c.TABLE_SCHEMA = t.TABLE_SCHEMA
            WHERE t.TABLE_TYPE = 'BASE TABLE';
            """;
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            var table = reader.GetString(0);
            var column = reader.GetString(1);
            if (!result.TryGetValue(table, out var set))
            {
                set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                result[table] = set;
            }
            set.Add(column);
        }
        return result;
    }

    private async Task EnsureOpenAsync(CancellationToken ct)
    {
        var connection = _db.Database.GetDbConnection();
        if (connection.State != System.Data.ConnectionState.Open) await connection.OpenAsync(ct);
    }

    private async Task CreateTableAsync(IEntityType entityType, CancellationToken ct)
    {
        var tableName = entityType.GetTableName()!;
        var columnDefs = entityType.GetProperties().Select(p => DescribeColumn(p)).ToList();
        var pk = entityType.FindPrimaryKey();
        var pkCols = pk?.Properties.Select(p => $"[{p.GetColumnName()}]") ?? Enumerable.Empty<string>();

        var sql = $"CREATE TABLE [{tableName}] ({string.Join(", ", columnDefs)}" +
                   (pk is not null ? $", CONSTRAINT [PK_{tableName}] PRIMARY KEY ({string.Join(", ", pkCols)})" : "") + ");";
        _logger.LogWarning("SchemaReconciler: creating missing table [{Table}].", tableName);
        await EnsureOpenAsync(ct);
        await _db.Database.ExecuteSqlRawAsync(sql, ct);
    }

    private async Task AddColumnAsync(string tableName, IProperty property, CancellationToken ct)
    {
        var columnName = property.GetColumnName();
        var def = DescribeColumn(property, forAlter: true);
        var sql = $"ALTER TABLE [{tableName}] ADD {def};";
        _logger.LogWarning("SchemaReconciler: adding missing column [{Table}].[{Column}].", tableName, columnName);
        await EnsureOpenAsync(ct);
        await _db.Database.ExecuteSqlRawAsync(sql, ct);
    }

    private static string DescribeColumn(IProperty property, bool forAlter = false)
    {
        var name = property.GetColumnName();
        var computedSql = property.GetComputedColumnSql();
        if (computedSql is not null) return $"[{name}] AS ({computedSql})";

        var type = property.GetColumnType();
        // A column added after the table already has rows must be nullable (or carry a
        // default) - never drop data, never fail the ALTER.
        var nullable = forAlter || property.IsNullable ? "NULL" : "NOT NULL";
        var defaultSql = property.GetDefaultValueSql();
        var defaultClause = defaultSql is not null ? $" DEFAULT {defaultSql}" : "";
        return $"[{name}] {type}{defaultClause} {nullable}";
    }
}
