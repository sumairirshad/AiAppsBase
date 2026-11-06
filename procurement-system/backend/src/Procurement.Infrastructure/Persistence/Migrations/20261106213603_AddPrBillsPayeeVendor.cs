using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Procurement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPrBillsPayeeVendor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "PayeeVendorId",
                table: "PrBills",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PrBills_PayeeVendorId",
                table: "PrBills",
                column: "PayeeVendorId");

            migrationBuilder.AddForeignKey(
                name: "FK_PrBills_Vendors_PayeeVendorId",
                table: "PrBills",
                column: "PayeeVendorId",
                principalTable: "Vendors",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PrBills_Vendors_PayeeVendorId",
                table: "PrBills");

            migrationBuilder.DropIndex(
                name: "IX_PrBills_PayeeVendorId",
                table: "PrBills");

            migrationBuilder.DropColumn(
                name: "PayeeVendorId",
                table: "PrBills");
        }
    }
}
