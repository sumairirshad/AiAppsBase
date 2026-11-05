using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Procurement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNumberSequences : Migration
    {
        private static readonly string[] SequenceNames =
        {
            "seq_pr", "seq_po", "seq_manual_po", "seq_grn", "seq_invoice", "seq_vr",
        };

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            foreach (var name in SequenceNames)
            {
                migrationBuilder.Sql($@"
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'{name}')
BEGIN
    CREATE SEQUENCE [{name}] AS BIGINT START WITH 1 INCREMENT BY 1 NO CYCLE;
END");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var name in SequenceNames)
            {
                migrationBuilder.Sql($@"
IF EXISTS (SELECT 1 FROM sys.sequences WHERE name = N'{name}')
BEGIN
    DROP SEQUENCE [{name}];
END");
            }
        }
    }
}
