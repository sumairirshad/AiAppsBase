using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Update;

namespace Procurement.Infrastructure.Persistence;

public class IdempotentSqlServerMigrationsSqlGenerator : SqlServerMigrationsSqlGenerator
{
    public IdempotentSqlServerMigrationsSqlGenerator(
        MigrationsSqlGeneratorDependencies dependencies,
        ICommandBatchPreparer commandBatchPreparer)
        : base(dependencies, commandBatchPreparer)
    {
    }

    protected override void Generate(CreateTableOperation operation, IModel? model, MigrationCommandListBuilder builder, bool terminate = true)
    {
        var schema = operation.Schema ?? "dbo";
        builder.AppendLine($"IF NOT EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = N'{schema}' AND t.name = N'{operation.Name}')");
        builder.AppendLine("BEGIN");
        using (builder.Indent())
        {
            base.Generate(operation, model, builder, terminate: false);
        }
        builder.AppendLine();
        builder.AppendLine("END");
        if (terminate)
        {
            builder.AppendLine(Dependencies.SqlGenerationHelper.StatementTerminator);
            builder.EndCommand();
        }
    }

    protected override void Generate(AddColumnOperation operation, IModel? model, MigrationCommandListBuilder builder, bool terminate = true)
    {
        var schema = operation.Schema ?? "dbo";
        builder.AppendLine(
            $"IF NOT EXISTS (SELECT 1 FROM sys.columns c JOIN sys.tables t ON c.object_id = t.object_id JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = N'{schema}' AND t.name = N'{operation.Table}' AND c.name = N'{operation.Name}')");
        builder.AppendLine("BEGIN");
        using (builder.Indent())
        {
            base.Generate(operation, model, builder, terminate: false);
        }
        builder.AppendLine();
        builder.AppendLine("END");
        if (terminate)
        {
            builder.AppendLine(Dependencies.SqlGenerationHelper.StatementTerminator);
            builder.EndCommand();
        }
    }

    protected override void Generate(CreateIndexOperation operation, IModel? model, MigrationCommandListBuilder builder, bool terminate = true)
    {
        var schema = operation.Schema ?? "dbo";
        builder.AppendLine($"IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'{operation.Name}' AND object_id = OBJECT_ID(N'{schema}.{operation.Table}'))");
        builder.AppendLine("BEGIN");
        using (builder.Indent())
        {
            base.Generate(operation, model, builder, terminate: false);
        }
        builder.AppendLine();
        builder.AppendLine("END");
        if (terminate)
        {
            builder.AppendLine(Dependencies.SqlGenerationHelper.StatementTerminator);
            builder.EndCommand();
        }
    }

    protected override void Generate(AddForeignKeyOperation operation, IModel? model, MigrationCommandListBuilder builder, bool terminate = true)
    {
        var schema = operation.Schema ?? "dbo";
        builder.AppendLine($"IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'{operation.Name}' AND parent_object_id = OBJECT_ID(N'{schema}.{operation.Table}'))");
        builder.AppendLine("BEGIN");
        using (builder.Indent())
        {
            base.Generate(operation, model, builder, terminate: false);
        }
        builder.AppendLine();
        builder.AppendLine("END");
        if (terminate)
        {
            builder.AppendLine(Dependencies.SqlGenerationHelper.StatementTerminator);
            builder.EndCommand();
        }
    }
}
