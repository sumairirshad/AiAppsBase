using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Procurement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ActionTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActionTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AdvanceTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdvanceTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AiCheckTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiCheckTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AmendmentTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AmendmentTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ApprovalRequestStatuses",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsTerminal = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalRequestStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ParentId = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categories_Categories_ParentId",
                        column: x => x.ParentId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ClauseCategories",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClauseCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CommentTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommentTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContractTemplates",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContractTypeId = table.Column<short>(type: "smallint", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractTemplates", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContractTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CostTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CostTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Currencies",
                columns: table => new
                {
                    Code = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Currencies", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "DispatchChannels",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DispatchChannels", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StorageKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    Sha256 = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DocumentTypeId = table.Column<short>(type: "smallint", nullable: false),
                    Classification = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VersionNo = table.Column<int>(type: "int", nullable: false),
                    ReplacesDocumentId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Documents_Documents_ReplacesDocumentId",
                        column: x => x.ReplacesDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DocumentTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EntityTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    TableName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EntityTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MonthEndAuditStatuses",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsTerminal = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonthEndAuditStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "NotificationTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OccurrenceStatuses",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OccurrenceStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OutboxMessages",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MessageType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Payload = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Attempts = table.Column<int>(type: "int", nullable: false),
                    NextAttemptAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastError = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxMessages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PoStatuses",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsTerminal = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PoStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PoTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PoTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProcurementModes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcurementModes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PrStatuses",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsTerminal = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QueryStatuses",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsTerminal = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QueryStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RecurringFrequencies",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringFrequencies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RecurringPlanTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringPlanTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SecurityDepositStatuses",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsTerminal = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityDepositStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SpendHeads",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ApprovalMode = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpendHeads", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StageTypes",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StageTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TaskStatuses",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsTerminal = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Units",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Precision = table.Column<byte>(type: "tinyint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Units", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Vendors",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VendorCode = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LegalName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Ntn = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Strn = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VendorStatusId = table.Column<short>(type: "smallint", nullable: false),
                    HasDeliveryHistory = table.Column<bool>(type: "bit", nullable: false),
                    BlacklistReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RowVer = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    OnTimeScore = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    PriceScore = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    QualityScore = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    OverallScore = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    IsStarVendor = table.Column<bool>(type: "bit", nullable: false),
                    ScoreUpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vendors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VendorStatuses",
                columns: table => new
                {
                    Id = table.Column<short>(type: "smallint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SortOrder = table.Column<short>(type: "smallint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsTerminal = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowDefinitions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EntityTypeId = table.Column<short>(type: "smallint", nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ActiveFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    ActiveTo = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContractClauses",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TemplateId = table.Column<long>(type: "bigint", nullable: false),
                    ClauseCategoryId = table.Column<short>(type: "smallint", nullable: false),
                    Sequence = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsMandatory = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContractClauses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContractClauses_ContractTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "ContractTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DocumentLinks",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DocumentId = table.Column<long>(type: "bigint", nullable: false),
                    EntityTypeId = table.Column<short>(type: "smallint", nullable: false),
                    EntityId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentLinks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentLinks_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RolePermissions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<long>(type: "bigint", nullable: false),
                    PermissionId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "Permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Items",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CategoryId = table.Column<long>(type: "bigint", nullable: false),
                    UnitId = table.Column<long>(type: "bigint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Items_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Items_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VendorCategories",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VendorId = table.Column<long>(type: "bigint", nullable: false),
                    CategoryId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorCategories_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VendorContacts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VendorId = table.Column<long>(type: "bigint", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorContacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorContacts_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VendorDocuments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VendorId = table.Column<long>(type: "bigint", nullable: false),
                    DocumentId = table.Column<long>(type: "bigint", nullable: false),
                    ExpiryDate = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorDocuments_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorDocuments_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SpendSubHeads",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SpendHeadId = table.Column<long>(type: "bigint", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProcurementModeId = table.Column<short>(type: "smallint", nullable: false),
                    AllowsTentative = table.Column<bool>(type: "bit", nullable: false),
                    WorkflowDefinitionId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpendSubHeads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SpendSubHeads_SpendHeads_SpendHeadId",
                        column: x => x.SpendHeadId,
                        principalTable: "SpendHeads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SpendSubHeads_WorkflowDefinitions_WorkflowDefinitionId",
                        column: x => x.WorkflowDefinitionId,
                        principalTable: "WorkflowDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AiChecks",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CheckTypeId = table.Column<short>(type: "smallint", nullable: false),
                    EntityTypeId = table.Column<short>(type: "smallint", nullable: false),
                    EntityId = table.Column<long>(type: "bigint", nullable: false),
                    Outcome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResultJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CheckedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Confidence = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    Disposition = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReviewedBy = table.Column<long>(type: "bigint", nullable: true),
                    ReviewedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiChecks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ApprovalBands",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PolicyVersionId = table.Column<long>(type: "bigint", nullable: false),
                    MinAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MaxAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Sequence = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalBands", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApprovalBands_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AuditEvents",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OccurredAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ActorUserId = table.Column<long>(type: "bigint", nullable: true),
                    ActorRoleId = table.Column<long>(type: "bigint", nullable: true),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EntityTypeId = table.Column<short>(type: "smallint", nullable: false),
                    EntityId = table.Column<long>(type: "bigint", nullable: true),
                    Outcome = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BeforeJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AfterJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CorrelationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditEvents_Roles_ActorRoleId",
                        column: x => x.ActorRoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AuditQueries",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EntityTypeId = table.Column<short>(type: "smallint", nullable: false),
                    EntityId = table.Column<long>(type: "bigint", nullable: false),
                    RaisedBy = table.Column<long>(type: "bigint", nullable: false),
                    RaisedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    AssignedRoleId = table.Column<long>(type: "bigint", nullable: false),
                    AssignedUserId = table.Column<long>(type: "bigint", nullable: true),
                    QueryText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResponseText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    QueryStatusId = table.Column<short>(type: "smallint", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditQueries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditQueries_Roles_AssignedRoleId",
                        column: x => x.AssignedRoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AuditStamps",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrId = table.Column<long>(type: "bigint", nullable: false),
                    PaymentVerified = table.Column<bool>(type: "bit", nullable: false),
                    DeliveryVerified = table.Column<bool>(type: "bit", nullable: false),
                    StampedBy = table.Column<long>(type: "bigint", nullable: false),
                    StampedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    StampedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditStamps", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Contracts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PoId = table.Column<long>(type: "bigint", nullable: false),
                    ContractTypeId = table.Column<short>(type: "smallint", nullable: false),
                    Terms = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: true),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    GeneratedDocumentId = table.Column<long>(type: "bigint", nullable: true),
                    SignedDocumentId = table.Column<long>(type: "bigint", nullable: true),
                    TemplateId = table.Column<long>(type: "bigint", nullable: true),
                    GoverningLaw = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CountryOfOrigin = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Incoterms = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChequeNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChequeBank = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChequeAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ChequeDocumentId = table.Column<long>(type: "bigint", nullable: true),
                    ChequeStatusId = table.Column<short>(type: "smallint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contracts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Contracts_ContractTemplates_TemplateId",
                        column: x => x.TemplateId,
                        principalTable: "ContractTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Contracts_Documents_ChequeDocumentId",
                        column: x => x.ChequeDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Contracts_Documents_GeneratedDocumentId",
                        column: x => x.GeneratedDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Contracts_Documents_SignedDocumentId",
                        column: x => x.SignedDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DepartmentCategories",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DepartmentId = table.Column<long>(type: "bigint", nullable: false),
                    CategoryId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DepartmentCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DepartmentCategories_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Departments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ParentId = table.Column<long>(type: "bigint", nullable: true),
                    HodUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Departments_Departments_ParentId",
                        column: x => x.ParentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmployeeNo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DepartmentId = table.Column<long>(type: "bigint", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowStages",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DefinitionId = table.Column<long>(type: "bigint", nullable: false),
                    StageCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Sequence = table.Column<int>(type: "int", nullable: false),
                    StageTypeId = table.Column<short>(type: "smallint", nullable: false),
                    RoleId = table.Column<long>(type: "bigint", nullable: true),
                    PrStatusId = table.Column<short>(type: "smallint", nullable: true),
                    ConditionExpr = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsOptional = table.Column<bool>(type: "bit", nullable: false),
                    EscalationDays = table.Column<int>(type: "int", nullable: true),
                    EscalateToRoleId = table.Column<long>(type: "bigint", nullable: true),
                    ScopeType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ScopeDepartmentId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowStages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowStages_Departments_ScopeDepartmentId",
                        column: x => x.ScopeDepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowStages_Roles_EscalateToRoleId",
                        column: x => x.EscalateToRoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowStages_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowStages_WorkflowDefinitions_DefinitionId",
                        column: x => x.DefinitionId,
                        principalTable: "WorkflowDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ItemRequests",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProposedName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CategoryId = table.Column<long>(type: "bigint", nullable: true),
                    RequestedBy = table.Column<long>(type: "bigint", nullable: false),
                    RequesterId = table.Column<long>(type: "bigint", nullable: false),
                    StatusId = table.Column<short>(type: "smallint", nullable: false),
                    DecisionBy = table.Column<long>(type: "bigint", nullable: true),
                    DecisionByUserId = table.Column<long>(type: "bigint", nullable: true),
                    DecisionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedItemId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemRequests_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ItemRequests_Items_CreatedItemId",
                        column: x => x.CreatedItemId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ItemRequests_Users_DecisionByUserId",
                        column: x => x.DecisionByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ItemRequests_Users_RequesterId",
                        column: x => x.RequesterId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MonthEndAudits",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Period = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: false),
                    StatusId = table.Column<short>(type: "smallint", nullable: false),
                    StartedBy = table.Column<long>(type: "bigint", nullable: false),
                    StartedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    CompletedBy = table.Column<long>(type: "bigint", nullable: true),
                    CompletedByUserId = table.Column<long>(type: "bigint", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Summary = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonthEndAudits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MonthEndAudits_Users_CompletedByUserId",
                        column: x => x.CompletedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MonthEndAudits_Users_StartedByUserId",
                        column: x => x.StartedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    RoleId = table.Column<long>(type: "bigint", nullable: true),
                    EntityTypeId = table.Column<short>(type: "smallint", nullable: false),
                    EntityId = table.Column<long>(type: "bigint", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NotificationTypeId = table.Column<short>(type: "smallint", nullable: false),
                    Channel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DedupeKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PolicyVersions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VersionNo = table.Column<int>(type: "int", nullable: false),
                    EffectiveFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    EffectiveTo = table.Column<DateOnly>(type: "date", nullable: true),
                    StatusId = table.Column<short>(type: "smallint", nullable: false),
                    ApprovedBy = table.Column<long>(type: "bigint", nullable: true),
                    ApprovedByUserId = table.Column<long>(type: "bigint", nullable: true),
                    ChangeReason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PolicyVersions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PolicyVersions_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OwnerDepartmentId = table.Column<long>(type: "bigint", nullable: false),
                    ManagerUserId = table.Column<long>(type: "bigint", nullable: true),
                    ContractProvided = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Projects_Departments_OwnerDepartmentId",
                        column: x => x.OwnerDepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Projects_Users_ManagerUserId",
                        column: x => x.ManagerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RecurringPlans",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlanNo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RecurringPlanTypeId = table.Column<short>(type: "smallint", nullable: false),
                    SpendSubHeadId = table.Column<long>(type: "bigint", nullable: false),
                    DepartmentId = table.Column<long>(type: "bigint", nullable: false),
                    LocationId = table.Column<long>(type: "bigint", nullable: false),
                    OwnerUserId = table.Column<long>(type: "bigint", nullable: false),
                    FrequencyId = table.Column<short>(type: "smallint", nullable: false),
                    GenerationDay = table.Column<byte>(type: "tinyint", nullable: false),
                    DueOffsetDays = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    CurrentVersionNo = table.Column<int>(type: "int", nullable: false),
                    StatusId = table.Column<short>(type: "smallint", nullable: false),
                    NextRunDate = table.Column<DateOnly>(type: "date", nullable: true),
                    VendorId = table.Column<long>(type: "bigint", nullable: true),
                    FixedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ApprovedBy = table.Column<long>(type: "bigint", nullable: true),
                    ApprovedByUserId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecurringPlans_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringPlans_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringPlans_SpendSubHeads_SpendSubHeadId",
                        column: x => x.SpendSubHeadId,
                        principalTable: "SpendSubHeads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringPlans_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringPlans_Users_OwnerUserId",
                        column: x => x.OwnerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringPlans_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserDepartmentAccess",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    DepartmentId = table.Column<long>(type: "bigint", nullable: false),
                    CanRaisePr = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDepartmentAccess", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserDepartmentAccess_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserDepartmentAccess_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserRoleAssignments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    RoleId = table.Column<long>(type: "bigint", nullable: false),
                    DepartmentId = table.Column<long>(type: "bigint", nullable: true),
                    LocationId = table.Column<long>(type: "bigint", nullable: true),
                    ValidFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    ValidTo = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoleAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserRoleAssignments_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserRoleAssignments_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserRoleAssignments_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserRoleAssignments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VendorBankAccounts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VendorId = table.Column<long>(type: "bigint", nullable: false),
                    BankName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AccountTitle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AccountNoEncrypted = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    AccountNoMasked = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TitleMatchesLegalName = table.Column<bool>(type: "bit", nullable: false),
                    ExceptionApprovedBy = table.Column<long>(type: "bigint", nullable: true),
                    ExceptionApprovedByUserId = table.Column<long>(type: "bigint", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorBankAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorBankAccounts_Users_ExceptionApprovedByUserId",
                        column: x => x.ExceptionApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorBankAccounts_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VendorRegistrationRequests",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestNo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProposedData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProposedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    SourceRoleId = table.Column<long>(type: "bigint", nullable: false),
                    StatusId = table.Column<short>(type: "smallint", nullable: false),
                    ProcurementDecisionBy = table.Column<long>(type: "bigint", nullable: true),
                    ProcurementDecisionByUserId = table.Column<long>(type: "bigint", nullable: true),
                    ProcurementReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedVendorId = table.Column<long>(type: "bigint", nullable: true),
                    ProcurementHodDecisionBy = table.Column<long>(type: "bigint", nullable: true),
                    ProcurementHodDecisionByUserId = table.Column<long>(type: "bigint", nullable: true),
                    ProcurementHodReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RequesterNotifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendorRegistrationRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendorRegistrationRequests_Roles_SourceRoleId",
                        column: x => x.SourceRoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorRegistrationRequests_Users_ProcurementDecisionByUserId",
                        column: x => x.ProcurementDecisionByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorRegistrationRequests_Users_ProcurementHodDecisionByUserId",
                        column: x => x.ProcurementHodDecisionByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorRegistrationRequests_Users_ProposedByUserId",
                        column: x => x.ProposedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VendorRegistrationRequests_Vendors_CreatedVendorId",
                        column: x => x.CreatedVendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PolicySettings",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PolicyVersionId = table.Column<long>(type: "bigint", nullable: false),
                    SettingKey = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ValueType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PolicySettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PolicySettings_PolicyVersions_PolicyVersionId",
                        column: x => x.PolicyVersionId,
                        principalTable: "PolicyVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuotationRules",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PolicyVersionId = table.Column<long>(type: "bigint", nullable: false),
                    SpendSubHeadId = table.Column<long>(type: "bigint", nullable: true),
                    MinAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MaxAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    StarVendor = table.Column<bool>(type: "bit", nullable: true),
                    Emergency = table.Column<bool>(type: "bit", nullable: true),
                    RequiredQuotes = table.Column<byte>(type: "tinyint", nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuotationRules_PolicyVersions_PolicyVersionId",
                        column: x => x.PolicyVersionId,
                        principalTable: "PolicyVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_QuotationRules_SpendSubHeads_SpendSubHeadId",
                        column: x => x.SpendSubHeadId,
                        principalTable: "SpendSubHeads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowInstances",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DefinitionId = table.Column<long>(type: "bigint", nullable: false),
                    EntityTypeId = table.Column<short>(type: "smallint", nullable: false),
                    EntityId = table.Column<long>(type: "bigint", nullable: false),
                    CurrentStageId = table.Column<long>(type: "bigint", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PolicyVersionId = table.Column<long>(type: "bigint", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RowVer = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowInstances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowInstances_PolicyVersions_PolicyVersionId",
                        column: x => x.PolicyVersionId,
                        principalTable: "PolicyVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowInstances_WorkflowDefinitions_DefinitionId",
                        column: x => x.DefinitionId,
                        principalTable: "WorkflowDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowInstances_WorkflowStages_CurrentStageId",
                        column: x => x.CurrentStageId,
                        principalTable: "WorkflowStages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RecurringPlanLines",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlanId = table.Column<long>(type: "bigint", nullable: false),
                    ItemId = table.Column<long>(type: "bigint", nullable: false),
                    Qty = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    UnitId = table.Column<long>(type: "bigint", nullable: false),
                    AgreedPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringPlanLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecurringPlanLines_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringPlanLines_RecurringPlans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "RecurringPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringPlanLines_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowTasks",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InstanceId = table.Column<long>(type: "bigint", nullable: false),
                    StageId = table.Column<long>(type: "bigint", nullable: false),
                    AssignedRoleId = table.Column<long>(type: "bigint", nullable: false),
                    AssignedUserId = table.Column<long>(type: "bigint", nullable: true),
                    ScopeDepartmentId = table.Column<long>(type: "bigint", nullable: true),
                    TaskStatusId = table.Column<short>(type: "smallint", nullable: false),
                    DueAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EscalatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EscalatedToRoleId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowTasks_Departments_ScopeDepartmentId",
                        column: x => x.ScopeDepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowTasks_Roles_AssignedRoleId",
                        column: x => x.AssignedRoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowTasks_Roles_EscalatedToRoleId",
                        column: x => x.EscalatedToRoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowTasks_Users_AssignedUserId",
                        column: x => x.AssignedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowTasks_WorkflowInstances_InstanceId",
                        column: x => x.InstanceId,
                        principalTable: "WorkflowInstances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowTasks_WorkflowStages_StageId",
                        column: x => x.StageId,
                        principalTable: "WorkflowStages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowActions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InstanceId = table.Column<long>(type: "bigint", nullable: false),
                    TaskId = table.Column<long>(type: "bigint", nullable: true),
                    ActionTypeId = table.Column<short>(type: "smallint", nullable: false),
                    ActorUserId = table.Column<long>(type: "bigint", nullable: false),
                    ActorRoleId = table.Column<long>(type: "bigint", nullable: false),
                    FromStageId = table.Column<long>(type: "bigint", nullable: true),
                    ToStageId = table.Column<long>(type: "bigint", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PolicyVersionId = table.Column<long>(type: "bigint", nullable: false),
                    CorrelationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkflowActions_PolicyVersions_PolicyVersionId",
                        column: x => x.PolicyVersionId,
                        principalTable: "PolicyVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowActions_Roles_ActorRoleId",
                        column: x => x.ActorRoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowActions_Users_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowActions_WorkflowInstances_InstanceId",
                        column: x => x.InstanceId,
                        principalTable: "WorkflowInstances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowActions_WorkflowStages_FromStageId",
                        column: x => x.FromStageId,
                        principalTable: "WorkflowStages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowActions_WorkflowStages_ToStageId",
                        column: x => x.ToStageId,
                        principalTable: "WorkflowStages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkflowActions_WorkflowTasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "WorkflowTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GoodsReceiptLines",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GrnId = table.Column<long>(type: "bigint", nullable: false),
                    PoLineId = table.Column<long>(type: "bigint", nullable: false),
                    DeliveredQty = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    AcceptedQty = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    RejectedQty = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    RejectReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EvidenceDocumentId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GoodsReceiptLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GoodsReceiptLines_Documents_EvidenceDocumentId",
                        column: x => x.EvidenceDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GoodsReceipts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GrnNumber = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PoId = table.Column<long>(type: "bigint", nullable: false),
                    ReceivedOn = table.Column<DateOnly>(type: "date", nullable: false),
                    DeliveryNoteNo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReceivedBy = table.Column<long>(type: "bigint", nullable: false),
                    ReceivedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    IsLate = table.Column<bool>(type: "bit", nullable: false),
                    DeliveryNoteDocumentId = table.Column<long>(type: "bigint", nullable: true),
                    OnTime = table.Column<bool>(type: "bit", nullable: true),
                    QualityRating = table.Column<byte>(type: "tinyint", nullable: true),
                    AcknowledgedBy = table.Column<long>(type: "bigint", nullable: true),
                    AcknowledgedByUserId = table.Column<long>(type: "bigint", nullable: true),
                    AcknowledgedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AckRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AckStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DisputeReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GoodsReceipts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GoodsReceipts_Documents_DeliveryNoteDocumentId",
                        column: x => x.DeliveryNoteDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GoodsReceipts_Users_AcknowledgedByUserId",
                        column: x => x.AcknowledgedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_GoodsReceipts_Users_ReceivedByUserId",
                        column: x => x.ReceivedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MonthEndAuditItems",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MonthEndAuditId = table.Column<long>(type: "bigint", nullable: false),
                    PrId = table.Column<long>(type: "bigint", nullable: false),
                    BillId = table.Column<long>(type: "bigint", nullable: true),
                    WasPreAudited = table.Column<bool>(type: "bit", nullable: false),
                    Finding = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonthEndAuditItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MonthEndAuditItems_MonthEndAudits_MonthEndAuditId",
                        column: x => x.MonthEndAuditId,
                        principalTable: "MonthEndAudits",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PoAmendments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PoId = table.Column<long>(type: "bigint", nullable: false),
                    AmendmentNo = table.Column<int>(type: "int", nullable: false),
                    AmendmentTypeId = table.Column<short>(type: "smallint", nullable: false),
                    OldValue = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NewValue = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsEscalation = table.Column<bool>(type: "bit", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ApprovedBy = table.Column<long>(type: "bigint", nullable: true),
                    ApprovedByUserId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PoAmendments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PoAmendments_Users_ApprovedByUserId",
                        column: x => x.ApprovedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PoLines",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PoId = table.Column<long>(type: "bigint", nullable: false),
                    PrLineId = table.Column<long>(type: "bigint", nullable: false),
                    QuotationLineId = table.Column<long>(type: "bigint", nullable: true),
                    Qty = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    LineTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "[Qty] * [UnitPrice]", stored: true),
                    AcceptedQty = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    OutstandingQty = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "[Qty] - [AcceptedQty]", stored: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PoLines", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PrBills",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrId = table.Column<long>(type: "bigint", nullable: false),
                    BillingPeriod = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BillAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Purpose = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    BillDocumentId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrBills", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrBills_Documents_BillDocumentId",
                        column: x => x.BillDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PrBudgetChecks",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrId = table.Column<long>(type: "bigint", nullable: false),
                    BudgetRef = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AvailableAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PrAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OverBudgetAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "CASE WHEN [PrAmount] > ISNULL([AvailableAmount], 0) THEN [PrAmount] - ISNULL([AvailableAmount], 0) ELSE 0 END", stored: true),
                    IsWithinBudget = table.Column<bool>(type: "bit", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CheckedBy = table.Column<long>(type: "bigint", nullable: false),
                    CheckedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    CheckedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    OpdDecisionBy = table.Column<long>(type: "bigint", nullable: true),
                    OpdDecisionByUserId = table.Column<long>(type: "bigint", nullable: true),
                    OpdReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrBudgetChecks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrBudgetChecks_Users_CheckedByUserId",
                        column: x => x.CheckedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PrBudgetChecks_Users_OpdDecisionByUserId",
                        column: x => x.OpdDecisionByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PrComments",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrId = table.Column<long>(type: "bigint", nullable: false),
                    CommentTypeId = table.Column<short>(type: "smallint", nullable: false),
                    AuthorUserId = table.Column<long>(type: "bigint", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ParentCommentId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrComments_PrComments_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "PrComments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PrComments_Users_AuthorUserId",
                        column: x => x.AuthorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PrLines",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrId = table.Column<long>(type: "bigint", nullable: false),
                    LineNo = table.Column<int>(type: "int", nullable: false),
                    ItemId = table.Column<long>(type: "bigint", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Qty = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    UnitId = table.Column<long>(type: "bigint", nullable: false),
                    EstUnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    LineTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false, computedColumnSql: "[Qty] * [EstUnitPrice]", stored: true),
                    SuggestedVendorId = table.Column<long>(type: "bigint", nullable: true),
                    SourcingGroupId = table.Column<long>(type: "bigint", nullable: true),
                    LocationId = table.Column<long>(type: "bigint", nullable: false),
                    AcceptedQty = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    AwardedVendorId = table.Column<long>(type: "bigint", nullable: true),
                    AwardedQuotationLineId = table.Column<long>(type: "bigint", nullable: true),
                    OverrideReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrLines_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PrLines_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PrLines_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PrLines_Vendors_AwardedVendorId",
                        column: x => x.AwardedVendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PrLines_Vendors_SuggestedVendorId",
                        column: x => x.SuggestedVendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PurchaseOrders",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PoNumber = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PrId = table.Column<long>(type: "bigint", nullable: false),
                    VendorId = table.Column<long>(type: "bigint", nullable: false),
                    PoTypeId = table.Column<short>(type: "smallint", nullable: false),
                    PoStatusId = table.Column<short>(type: "smallint", nullable: false),
                    ReplacesPoId = table.Column<long>(type: "bigint", nullable: true),
                    CurrencyCode = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    SubTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TaxTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RetentionPct = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    DeliveryDate = table.Column<DateOnly>(type: "date", nullable: false),
                    PaymentTerms = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IdempotencyKey = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IssuedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RowVer = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    PoBaseNumber = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PoSuffix = table.Column<string>(type: "nvarchar(1)", nullable: true),
                    AdvanceTypeId = table.Column<short>(type: "smallint", nullable: false),
                    AdvancePct = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    AdvanceAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    AdvancePaid = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DispatchChannelId = table.Column<short>(type: "smallint", nullable: true),
                    DispatchedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseOrders_Currencies_CurrencyCode",
                        column: x => x.CurrencyCode,
                        principalTable: "Currencies",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseOrders_PurchaseOrders_ReplacesPoId",
                        column: x => x.ReplacesPoId,
                        principalTable: "PurchaseOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseOrders_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PurchaseRequisitions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrNumber = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RequesterId = table.Column<long>(type: "bigint", nullable: false),
                    DepartmentId = table.Column<long>(type: "bigint", nullable: false),
                    LocationId = table.Column<long>(type: "bigint", nullable: false),
                    SpendSubHeadId = table.Column<long>(type: "bigint", nullable: false),
                    ProjectId = table.Column<long>(type: "bigint", nullable: true),
                    CostTypeId = table.Column<short>(type: "smallint", nullable: false),
                    IsEmergency = table.Column<bool>(type: "bit", nullable: false),
                    EmergencyJustification = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EstimatedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ApprovedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    FinalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CurrencyCode = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    RequiredQuotes = table.Column<byte>(type: "tinyint", nullable: true),
                    PrStatusId = table.Column<short>(type: "smallint", nullable: false),
                    WorkflowInstanceId = table.Column<long>(type: "bigint", nullable: true),
                    PolicyVersionId = table.Column<long>(type: "bigint", nullable: true),
                    RecurringOccurrenceId = table.Column<long>(type: "bigint", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ClosedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RowVer = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: false),
                    RaisedOnBehalf = table.Column<bool>(type: "bit", nullable: false),
                    TentativeVariancePct = table.Column<decimal>(type: "decimal(7,2)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseRequisitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitions_Currencies_CurrencyCode",
                        column: x => x.CurrencyCode,
                        principalTable: "Currencies",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitions_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitions_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitions_PolicyVersions_PolicyVersionId",
                        column: x => x.PolicyVersionId,
                        principalTable: "PolicyVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitions_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitions_SpendSubHeads_SpendSubHeadId",
                        column: x => x.SpendSubHeadId,
                        principalTable: "SpendSubHeads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitions_Users_RequesterId",
                        column: x => x.RequesterId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PurchaseRequisitions_WorkflowInstances_WorkflowInstanceId",
                        column: x => x.WorkflowInstanceId,
                        principalTable: "WorkflowInstances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RecurringOccurrences",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlanId = table.Column<long>(type: "bigint", nullable: false),
                    PlanVersionNo = table.Column<int>(type: "int", nullable: false),
                    OccurrenceKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ScheduledFor = table.Column<DateOnly>(type: "date", nullable: false),
                    OccurrenceStatusId = table.Column<short>(type: "smallint", nullable: false),
                    GeneratedPrId = table.Column<long>(type: "bigint", nullable: true),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Error = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecurringOccurrences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecurringOccurrences_PurchaseRequisitions_GeneratedPrId",
                        column: x => x.GeneratedPrId,
                        principalTable: "PurchaseRequisitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RecurringOccurrences_RecurringPlans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "RecurringPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SupplierInvoices",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InvoiceNo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    VendorId = table.Column<long>(type: "bigint", nullable: false),
                    VendorInvoiceRef = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    VendorRefNormalized = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PrId = table.Column<long>(type: "bigint", nullable: false),
                    PoId = table.Column<long>(type: "bigint", nullable: true),
                    InvoiceDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CurrencyCode = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DocumentId = table.Column<long>(type: "bigint", nullable: false),
                    UploadedBy = table.Column<long>(type: "bigint", nullable: false),
                    UploadedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    ForwardedToFinanceAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ForwardedBy = table.Column<long>(type: "bigint", nullable: true),
                    ForwardedByUserId = table.Column<long>(type: "bigint", nullable: true),
                    BillStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FinancePortalRef = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PaidAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsFullyPaid = table.Column<bool>(type: "bit", nullable: false, computedColumnSql: "CASE WHEN [PaidAmount] >= [Total] THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END", stored: true),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ProofDocumentId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplierInvoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupplierInvoices_Currencies_CurrencyCode",
                        column: x => x.CurrencyCode,
                        principalTable: "Currencies",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SupplierInvoices_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SupplierInvoices_Documents_ProofDocumentId",
                        column: x => x.ProofDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SupplierInvoices_PurchaseOrders_PoId",
                        column: x => x.PoId,
                        principalTable: "PurchaseOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SupplierInvoices_PurchaseRequisitions_PrId",
                        column: x => x.PrId,
                        principalTable: "PurchaseRequisitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SupplierInvoices_Users_ForwardedByUserId",
                        column: x => x.ForwardedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SupplierInvoices_Users_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SupplierInvoices_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "QuotationLines",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuotationId = table.Column<long>(type: "bigint", nullable: false),
                    PrLineId = table.Column<long>(type: "bigint", nullable: false),
                    Qty = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Tax = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Discount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DeliveryDays = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuotationLines_PrLines_PrLineId",
                        column: x => x.PrLineId,
                        principalTable: "PrLines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Quotations",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrId = table.Column<long>(type: "bigint", nullable: false),
                    VendorId = table.Column<long>(type: "bigint", nullable: false),
                    QuotationNo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QuotationDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CurrencyCode = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ValidUntil = table.Column<DateOnly>(type: "date", nullable: true),
                    DocumentId = table.Column<long>(type: "bigint", nullable: false),
                    SourcingGroupId = table.Column<long>(type: "bigint", nullable: false),
                    TaxTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ComparableTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Quotations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Quotations_Currencies_CurrencyCode",
                        column: x => x.CurrencyCode,
                        principalTable: "Currencies",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Quotations_Documents_DocumentId",
                        column: x => x.DocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Quotations_PurchaseRequisitions_PrId",
                        column: x => x.PrId,
                        principalTable: "PurchaseRequisitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Quotations_Vendors_VendorId",
                        column: x => x.VendorId,
                        principalTable: "Vendors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SourcingGroups",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrId = table.Column<long>(type: "bigint", nullable: false),
                    GroupNo = table.Column<int>(type: "int", nullable: false),
                    CategoryId = table.Column<long>(type: "bigint", nullable: true),
                    GroupAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RequiredQuotes = table.Column<byte>(type: "tinyint", nullable: false),
                    QuotationRuleId = table.Column<long>(type: "bigint", nullable: false),
                    RecommendedQuotationId = table.Column<long>(type: "bigint", nullable: true),
                    SelectedQuotationId = table.Column<long>(type: "bigint", nullable: true),
                    SelectionJustification = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SelectedBy = table.Column<long>(type: "bigint", nullable: true),
                    SelectedByUserId = table.Column<long>(type: "bigint", nullable: true),
                    OpdDecisionBy = table.Column<long>(type: "bigint", nullable: true),
                    OpdDecisionByUserId = table.Column<long>(type: "bigint", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<long>(type: "bigint", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedByUserId = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SourcingGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SourcingGroups_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SourcingGroups_PurchaseRequisitions_PrId",
                        column: x => x.PrId,
                        principalTable: "PurchaseRequisitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SourcingGroups_QuotationRules_QuotationRuleId",
                        column: x => x.QuotationRuleId,
                        principalTable: "QuotationRules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SourcingGroups_Quotations_RecommendedQuotationId",
                        column: x => x.RecommendedQuotationId,
                        principalTable: "Quotations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SourcingGroups_Quotations_SelectedQuotationId",
                        column: x => x.SelectedQuotationId,
                        principalTable: "Quotations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SourcingGroups_Users_OpdDecisionByUserId",
                        column: x => x.OpdDecisionByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SourcingGroups_Users_SelectedByUserId",
                        column: x => x.SelectedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActionTypes_Code",
                table: "ActionTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AdvanceTypes_Code",
                table: "AdvanceTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AiChecks_ReviewedByUserId",
                table: "AiChecks",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AiCheckTypes_Code",
                table: "AiCheckTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AmendmentTypes_Code",
                table: "AmendmentTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalBands_PolicyVersionId",
                table: "ApprovalBands",
                column: "PolicyVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalBands_RoleId",
                table: "ApprovalBands",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalRequestStatuses_Code",
                table: "ApprovalRequestStatuses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditEvents_ActorRoleId",
                table: "AuditEvents",
                column: "ActorRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditEvents_ActorUserId",
                table: "AuditEvents",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditQueries_AssignedRoleId",
                table: "AuditQueries",
                column: "AssignedRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditQueries_AssignedUserId",
                table: "AuditQueries",
                column: "AssignedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditQueries_RaisedByUserId",
                table: "AuditQueries",
                column: "RaisedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditStamps_PrId",
                table: "AuditStamps",
                column: "PrId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditStamps_StampedByUserId",
                table: "AuditStamps",
                column: "StampedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Code",
                table: "Categories",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_ParentId",
                table: "Categories",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_ClauseCategories_Code",
                table: "ClauseCategories",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommentTypes_Code",
                table: "CommentTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractClauses_TemplateId",
                table: "ContractClauses",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_ChequeDocumentId",
                table: "Contracts",
                column: "ChequeDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_GeneratedDocumentId",
                table: "Contracts",
                column: "GeneratedDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_PoId",
                table: "Contracts",
                column: "PoId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_SignedDocumentId",
                table: "Contracts",
                column: "SignedDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_TemplateId",
                table: "Contracts",
                column: "TemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_ContractTemplates_Code",
                table: "ContractTemplates",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContractTypes_Code",
                table: "ContractTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CostTypes_Code",
                table: "CostTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DepartmentCategories_CategoryId",
                table: "DepartmentCategories",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_DepartmentCategories_DepartmentId_CategoryId",
                table: "DepartmentCategories",
                columns: new[] { "DepartmentId", "CategoryId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Departments_Code",
                table: "Departments",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Departments_HodUserId",
                table: "Departments",
                column: "HodUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Departments_ParentId",
                table: "Departments",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_DispatchChannels_Code",
                table: "DispatchChannels",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentLinks_DocumentId",
                table: "DocumentLinks",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_ReplacesDocumentId",
                table: "Documents",
                column: "ReplacesDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_StorageKey",
                table: "Documents",
                column: "StorageKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentTypes_Code",
                table: "DocumentTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EntityTypes_Code",
                table: "EntityTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GoodsReceiptLines_EvidenceDocumentId",
                table: "GoodsReceiptLines",
                column: "EvidenceDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_GoodsReceiptLines_GrnId",
                table: "GoodsReceiptLines",
                column: "GrnId");

            migrationBuilder.CreateIndex(
                name: "IX_GoodsReceiptLines_PoLineId",
                table: "GoodsReceiptLines",
                column: "PoLineId");

            migrationBuilder.CreateIndex(
                name: "IX_GoodsReceipts_AcknowledgedByUserId",
                table: "GoodsReceipts",
                column: "AcknowledgedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GoodsReceipts_DeliveryNoteDocumentId",
                table: "GoodsReceipts",
                column: "DeliveryNoteDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_GoodsReceipts_GrnNumber",
                table: "GoodsReceipts",
                column: "GrnNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GoodsReceipts_PoId",
                table: "GoodsReceipts",
                column: "PoId");

            migrationBuilder.CreateIndex(
                name: "IX_GoodsReceipts_ReceivedByUserId",
                table: "GoodsReceipts",
                column: "ReceivedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemRequests_CategoryId",
                table: "ItemRequests",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemRequests_CreatedItemId",
                table: "ItemRequests",
                column: "CreatedItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemRequests_DecisionByUserId",
                table: "ItemRequests",
                column: "DecisionByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemRequests_RequesterId",
                table: "ItemRequests",
                column: "RequesterId");

            migrationBuilder.CreateIndex(
                name: "IX_Items_CategoryId",
                table: "Items",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Items_Code",
                table: "Items",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Items_UnitId",
                table: "Items",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_Code",
                table: "Locations",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MonthEndAuditItems_BillId",
                table: "MonthEndAuditItems",
                column: "BillId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthEndAuditItems_MonthEndAuditId",
                table: "MonthEndAuditItems",
                column: "MonthEndAuditId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthEndAuditItems_PrId",
                table: "MonthEndAuditItems",
                column: "PrId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthEndAudits_CompletedByUserId",
                table: "MonthEndAudits",
                column: "CompletedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthEndAudits_Period",
                table: "MonthEndAudits",
                column: "Period",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MonthEndAudits_StartedByUserId",
                table: "MonthEndAudits",
                column: "StartedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthEndAuditStatuses_Code",
                table: "MonthEndAuditStatuses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_DedupeKey",
                table: "Notifications",
                column: "DedupeKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RoleId",
                table: "Notifications",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationTypes_Code",
                table: "NotificationTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OccurrenceStatuses_Code",
                table: "OccurrenceStatuses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_Code",
                table: "Permissions",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PoAmendments_ApprovedByUserId",
                table: "PoAmendments",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PoAmendments_PoId",
                table: "PoAmendments",
                column: "PoId");

            migrationBuilder.CreateIndex(
                name: "IX_PolicySettings_PolicyVersionId",
                table: "PolicySettings",
                column: "PolicyVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_PolicyVersions_ApprovedByUserId",
                table: "PolicyVersions",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PolicyVersions_VersionNo",
                table: "PolicyVersions",
                column: "VersionNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PoLines_PoId",
                table: "PoLines",
                column: "PoId");

            migrationBuilder.CreateIndex(
                name: "IX_PoLines_PrLineId",
                table: "PoLines",
                column: "PrLineId");

            migrationBuilder.CreateIndex(
                name: "IX_PoLines_QuotationLineId",
                table: "PoLines",
                column: "QuotationLineId");

            migrationBuilder.CreateIndex(
                name: "IX_PoStatuses_Code",
                table: "PoStatuses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PoTypes_Code",
                table: "PoTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PrBills_BillDocumentId",
                table: "PrBills",
                column: "BillDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_PrBills_PrId",
                table: "PrBills",
                column: "PrId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PrBudgetChecks_CheckedByUserId",
                table: "PrBudgetChecks",
                column: "CheckedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PrBudgetChecks_OpdDecisionByUserId",
                table: "PrBudgetChecks",
                column: "OpdDecisionByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PrBudgetChecks_PrId",
                table: "PrBudgetChecks",
                column: "PrId");

            migrationBuilder.CreateIndex(
                name: "IX_PrComments_AuthorUserId",
                table: "PrComments",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PrComments_ParentCommentId",
                table: "PrComments",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_PrComments_PrId",
                table: "PrComments",
                column: "PrId");

            migrationBuilder.CreateIndex(
                name: "IX_PrLines_AwardedQuotationLineId",
                table: "PrLines",
                column: "AwardedQuotationLineId");

            migrationBuilder.CreateIndex(
                name: "IX_PrLines_AwardedVendorId",
                table: "PrLines",
                column: "AwardedVendorId");

            migrationBuilder.CreateIndex(
                name: "IX_PrLines_ItemId",
                table: "PrLines",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PrLines_LocationId",
                table: "PrLines",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_PrLines_PrId",
                table: "PrLines",
                column: "PrId");

            migrationBuilder.CreateIndex(
                name: "IX_PrLines_SourcingGroupId",
                table: "PrLines",
                column: "SourcingGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_PrLines_SuggestedVendorId",
                table: "PrLines",
                column: "SuggestedVendorId");

            migrationBuilder.CreateIndex(
                name: "IX_PrLines_UnitId",
                table: "PrLines",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcurementModes_Code",
                table: "ProcurementModes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projects_ManagerUserId",
                table: "Projects",
                column: "ManagerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_OwnerDepartmentId",
                table: "Projects",
                column: "OwnerDepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_PrStatuses_Code",
                table: "PrStatuses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_CurrencyCode",
                table: "PurchaseOrders",
                column: "CurrencyCode");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_IdempotencyKey",
                table: "PurchaseOrders",
                column: "IdempotencyKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_PoBaseNumber_PoSuffix",
                table: "PurchaseOrders",
                columns: new[] { "PoBaseNumber", "PoSuffix" },
                unique: true,
                filter: "[PoSuffix] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_PoNumber",
                table: "PurchaseOrders",
                column: "PoNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_PrId",
                table: "PurchaseOrders",
                column: "PrId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_ReplacesPoId",
                table: "PurchaseOrders",
                column: "ReplacesPoId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrders_VendorId",
                table: "PurchaseOrders",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_CurrencyCode",
                table: "PurchaseRequisitions",
                column: "CurrencyCode");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_DepartmentId",
                table: "PurchaseRequisitions",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_LocationId",
                table: "PurchaseRequisitions",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_PolicyVersionId",
                table: "PurchaseRequisitions",
                column: "PolicyVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_PrNumber",
                table: "PurchaseRequisitions",
                column: "PrNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_ProjectId",
                table: "PurchaseRequisitions",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_RecurringOccurrenceId",
                table: "PurchaseRequisitions",
                column: "RecurringOccurrenceId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_RequesterId",
                table: "PurchaseRequisitions",
                column: "RequesterId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_SpendSubHeadId",
                table: "PurchaseRequisitions",
                column: "SpendSubHeadId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseRequisitions_WorkflowInstanceId",
                table: "PurchaseRequisitions",
                column: "WorkflowInstanceId");

            migrationBuilder.CreateIndex(
                name: "IX_QueryStatuses_Code",
                table: "QueryStatuses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuotationLines_PrLineId",
                table: "QuotationLines",
                column: "PrLineId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationLines_QuotationId",
                table: "QuotationLines",
                column: "QuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationRules_PolicyVersionId",
                table: "QuotationRules",
                column: "PolicyVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_QuotationRules_SpendSubHeadId",
                table: "QuotationRules",
                column: "SpendSubHeadId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_CurrencyCode",
                table: "Quotations",
                column: "CurrencyCode");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_DocumentId",
                table: "Quotations",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_PrId",
                table: "Quotations",
                column: "PrId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_SourcingGroupId",
                table: "Quotations",
                column: "SourcingGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_VendorId",
                table: "Quotations",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringFrequencies_Code",
                table: "RecurringFrequencies",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecurringOccurrences_GeneratedPrId",
                table: "RecurringOccurrences",
                column: "GeneratedPrId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringOccurrences_PlanId_OccurrenceKey",
                table: "RecurringOccurrences",
                columns: new[] { "PlanId", "OccurrenceKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPlanLines_ItemId",
                table: "RecurringPlanLines",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPlanLines_PlanId",
                table: "RecurringPlanLines",
                column: "PlanId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPlanLines_UnitId",
                table: "RecurringPlanLines",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPlans_ApprovedByUserId",
                table: "RecurringPlans",
                column: "ApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPlans_DepartmentId",
                table: "RecurringPlans",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPlans_LocationId",
                table: "RecurringPlans",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPlans_OwnerUserId",
                table: "RecurringPlans",
                column: "OwnerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPlans_PlanNo",
                table: "RecurringPlans",
                column: "PlanNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPlans_SpendSubHeadId",
                table: "RecurringPlans",
                column: "SpendSubHeadId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPlans_VendorId",
                table: "RecurringPlans",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_RecurringPlanTypes_Code",
                table: "RecurringPlanTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_PermissionId",
                table: "RolePermissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_RoleId_PermissionId",
                table: "RolePermissions",
                columns: new[] { "RoleId", "PermissionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Code",
                table: "Roles",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SecurityDepositStatuses_Code",
                table: "SecurityDepositStatuses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SourcingGroups_CategoryId",
                table: "SourcingGroups",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_SourcingGroups_OpdDecisionByUserId",
                table: "SourcingGroups",
                column: "OpdDecisionByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SourcingGroups_PrId",
                table: "SourcingGroups",
                column: "PrId");

            migrationBuilder.CreateIndex(
                name: "IX_SourcingGroups_QuotationRuleId",
                table: "SourcingGroups",
                column: "QuotationRuleId");

            migrationBuilder.CreateIndex(
                name: "IX_SourcingGroups_RecommendedQuotationId",
                table: "SourcingGroups",
                column: "RecommendedQuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_SourcingGroups_SelectedByUserId",
                table: "SourcingGroups",
                column: "SelectedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SourcingGroups_SelectedQuotationId",
                table: "SourcingGroups",
                column: "SelectedQuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_SpendHeads_Code",
                table: "SpendHeads",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SpendSubHeads_Code",
                table: "SpendSubHeads",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SpendSubHeads_SpendHeadId",
                table: "SpendSubHeads",
                column: "SpendHeadId");

            migrationBuilder.CreateIndex(
                name: "IX_SpendSubHeads_WorkflowDefinitionId",
                table: "SpendSubHeads",
                column: "WorkflowDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_StageTypes_Code",
                table: "StageTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupplierInvoices_CurrencyCode",
                table: "SupplierInvoices",
                column: "CurrencyCode");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierInvoices_DocumentId",
                table: "SupplierInvoices",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierInvoices_ForwardedByUserId",
                table: "SupplierInvoices",
                column: "ForwardedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierInvoices_InvoiceNo",
                table: "SupplierInvoices",
                column: "InvoiceNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupplierInvoices_PoId",
                table: "SupplierInvoices",
                column: "PoId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierInvoices_PrId",
                table: "SupplierInvoices",
                column: "PrId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierInvoices_ProofDocumentId",
                table: "SupplierInvoices",
                column: "ProofDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierInvoices_UploadedByUserId",
                table: "SupplierInvoices",
                column: "UploadedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SupplierInvoices_VendorId_VendorRefNormalized",
                table: "SupplierInvoices",
                columns: new[] { "VendorId", "VendorRefNormalized" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskStatuses_Code",
                table: "TaskStatuses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Units_Code",
                table: "Units",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserDepartmentAccess_DepartmentId",
                table: "UserDepartmentAccess",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_UserDepartmentAccess_UserId",
                table: "UserDepartmentAccess",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoleAssignments_DepartmentId",
                table: "UserRoleAssignments",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoleAssignments_LocationId",
                table: "UserRoleAssignments",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoleAssignments_RoleId",
                table: "UserRoleAssignments",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoleAssignments_UserId",
                table: "UserRoleAssignments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_DepartmentId",
                table: "Users",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_EmployeeNo",
                table: "Users",
                column: "EmployeeNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VendorBankAccounts_ExceptionApprovedByUserId",
                table: "VendorBankAccounts",
                column: "ExceptionApprovedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorBankAccounts_VendorId",
                table: "VendorBankAccounts",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorCategories_CategoryId",
                table: "VendorCategories",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorCategories_VendorId_CategoryId",
                table: "VendorCategories",
                columns: new[] { "VendorId", "CategoryId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VendorContacts_VendorId",
                table: "VendorContacts",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorDocuments_DocumentId",
                table: "VendorDocuments",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorDocuments_VendorId",
                table: "VendorDocuments",
                column: "VendorId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorRegistrationRequests_CreatedVendorId",
                table: "VendorRegistrationRequests",
                column: "CreatedVendorId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorRegistrationRequests_ProcurementDecisionByUserId",
                table: "VendorRegistrationRequests",
                column: "ProcurementDecisionByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorRegistrationRequests_ProcurementHodDecisionByUserId",
                table: "VendorRegistrationRequests",
                column: "ProcurementHodDecisionByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorRegistrationRequests_ProposedByUserId",
                table: "VendorRegistrationRequests",
                column: "ProposedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_VendorRegistrationRequests_RequestNo",
                table: "VendorRegistrationRequests",
                column: "RequestNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VendorRegistrationRequests_SourceRoleId",
                table: "VendorRegistrationRequests",
                column: "SourceRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Vendors_Ntn",
                table: "Vendors",
                column: "Ntn",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vendors_VendorCode",
                table: "Vendors",
                column: "VendorCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VendorStatuses_Code",
                table: "VendorStatuses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowActions_ActorRoleId",
                table: "WorkflowActions",
                column: "ActorRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowActions_ActorUserId",
                table: "WorkflowActions",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowActions_FromStageId",
                table: "WorkflowActions",
                column: "FromStageId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowActions_InstanceId",
                table: "WorkflowActions",
                column: "InstanceId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowActions_PolicyVersionId",
                table: "WorkflowActions",
                column: "PolicyVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowActions_TaskId",
                table: "WorkflowActions",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowActions_ToStageId",
                table: "WorkflowActions",
                column: "ToStageId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowInstances_CurrentStageId",
                table: "WorkflowInstances",
                column: "CurrentStageId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowInstances_DefinitionId",
                table: "WorkflowInstances",
                column: "DefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowInstances_PolicyVersionId",
                table: "WorkflowInstances",
                column: "PolicyVersionId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowStages_DefinitionId",
                table: "WorkflowStages",
                column: "DefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowStages_EscalateToRoleId",
                table: "WorkflowStages",
                column: "EscalateToRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowStages_RoleId",
                table: "WorkflowStages",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowStages_ScopeDepartmentId",
                table: "WorkflowStages",
                column: "ScopeDepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTasks_AssignedRoleId",
                table: "WorkflowTasks",
                column: "AssignedRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTasks_AssignedUserId",
                table: "WorkflowTasks",
                column: "AssignedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTasks_EscalatedToRoleId",
                table: "WorkflowTasks",
                column: "EscalatedToRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTasks_InstanceId",
                table: "WorkflowTasks",
                column: "InstanceId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTasks_ScopeDepartmentId",
                table: "WorkflowTasks",
                column: "ScopeDepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowTasks_StageId",
                table: "WorkflowTasks",
                column: "StageId");

            migrationBuilder.AddForeignKey(
                name: "FK_AiChecks_Users_ReviewedByUserId",
                table: "AiChecks",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ApprovalBands_PolicyVersions_PolicyVersionId",
                table: "ApprovalBands",
                column: "PolicyVersionId",
                principalTable: "PolicyVersions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AuditEvents_Users_ActorUserId",
                table: "AuditEvents",
                column: "ActorUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AuditQueries_Users_AssignedUserId",
                table: "AuditQueries",
                column: "AssignedUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AuditQueries_Users_RaisedByUserId",
                table: "AuditQueries",
                column: "RaisedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AuditStamps_PurchaseRequisitions_PrId",
                table: "AuditStamps",
                column: "PrId",
                principalTable: "PurchaseRequisitions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_AuditStamps_Users_StampedByUserId",
                table: "AuditStamps",
                column: "StampedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Contracts_PurchaseOrders_PoId",
                table: "Contracts",
                column: "PoId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DepartmentCategories_Departments_DepartmentId",
                table: "DepartmentCategories",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Departments_Users_HodUserId",
                table: "Departments",
                column: "HodUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GoodsReceiptLines_GoodsReceipts_GrnId",
                table: "GoodsReceiptLines",
                column: "GrnId",
                principalTable: "GoodsReceipts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GoodsReceiptLines_PoLines_PoLineId",
                table: "GoodsReceiptLines",
                column: "PoLineId",
                principalTable: "PoLines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GoodsReceipts_PurchaseOrders_PoId",
                table: "GoodsReceipts",
                column: "PoId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MonthEndAuditItems_PurchaseRequisitions_PrId",
                table: "MonthEndAuditItems",
                column: "PrId",
                principalTable: "PurchaseRequisitions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MonthEndAuditItems_SupplierInvoices_BillId",
                table: "MonthEndAuditItems",
                column: "BillId",
                principalTable: "SupplierInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PoAmendments_PurchaseOrders_PoId",
                table: "PoAmendments",
                column: "PoId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PoLines_PrLines_PrLineId",
                table: "PoLines",
                column: "PrLineId",
                principalTable: "PrLines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PoLines_PurchaseOrders_PoId",
                table: "PoLines",
                column: "PoId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PoLines_QuotationLines_QuotationLineId",
                table: "PoLines",
                column: "QuotationLineId",
                principalTable: "QuotationLines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PrBills_PurchaseRequisitions_PrId",
                table: "PrBills",
                column: "PrId",
                principalTable: "PurchaseRequisitions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PrBudgetChecks_PurchaseRequisitions_PrId",
                table: "PrBudgetChecks",
                column: "PrId",
                principalTable: "PurchaseRequisitions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PrComments_PurchaseRequisitions_PrId",
                table: "PrComments",
                column: "PrId",
                principalTable: "PurchaseRequisitions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PrLines_PurchaseRequisitions_PrId",
                table: "PrLines",
                column: "PrId",
                principalTable: "PurchaseRequisitions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PrLines_QuotationLines_AwardedQuotationLineId",
                table: "PrLines",
                column: "AwardedQuotationLineId",
                principalTable: "QuotationLines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PrLines_SourcingGroups_SourcingGroupId",
                table: "PrLines",
                column: "SourcingGroupId",
                principalTable: "SourcingGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrders_PurchaseRequisitions_PrId",
                table: "PurchaseOrders",
                column: "PrId",
                principalTable: "PurchaseRequisitions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseRequisitions_RecurringOccurrences_RecurringOccurrenceId",
                table: "PurchaseRequisitions",
                column: "RecurringOccurrenceId",
                principalTable: "RecurringOccurrences",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_QuotationLines_Quotations_QuotationId",
                table: "QuotationLines",
                column: "QuotationId",
                principalTable: "Quotations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Quotations_SourcingGroups_SourcingGroupId",
                table: "Quotations",
                column: "SourcingGroupId",
                principalTable: "SourcingGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Departments_Users_HodUserId",
                table: "Departments");

            migrationBuilder.DropForeignKey(
                name: "FK_PolicyVersions_Users_ApprovedByUserId",
                table: "PolicyVersions");

            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Users_ManagerUserId",
                table: "Projects");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseRequisitions_Users_RequesterId",
                table: "PurchaseRequisitions");

            migrationBuilder.DropForeignKey(
                name: "FK_RecurringPlans_Users_ApprovedByUserId",
                table: "RecurringPlans");

            migrationBuilder.DropForeignKey(
                name: "FK_RecurringPlans_Users_OwnerUserId",
                table: "RecurringPlans");

            migrationBuilder.DropForeignKey(
                name: "FK_SourcingGroups_Users_OpdDecisionByUserId",
                table: "SourcingGroups");

            migrationBuilder.DropForeignKey(
                name: "FK_SourcingGroups_Users_SelectedByUserId",
                table: "SourcingGroups");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseRequisitions_PolicyVersions_PolicyVersionId",
                table: "PurchaseRequisitions");

            migrationBuilder.DropForeignKey(
                name: "FK_QuotationRules_PolicyVersions_PolicyVersionId",
                table: "QuotationRules");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkflowInstances_PolicyVersions_PolicyVersionId",
                table: "WorkflowInstances");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkflowStages_Roles_EscalateToRoleId",
                table: "WorkflowStages");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkflowStages_Roles_RoleId",
                table: "WorkflowStages");

            migrationBuilder.DropForeignKey(
                name: "FK_PrLines_PurchaseRequisitions_PrId",
                table: "PrLines");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotations_PurchaseRequisitions_PrId",
                table: "Quotations");

            migrationBuilder.DropForeignKey(
                name: "FK_RecurringOccurrences_PurchaseRequisitions_GeneratedPrId",
                table: "RecurringOccurrences");

            migrationBuilder.DropForeignKey(
                name: "FK_SourcingGroups_PurchaseRequisitions_PrId",
                table: "SourcingGroups");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotations_Documents_DocumentId",
                table: "Quotations");

            migrationBuilder.DropForeignKey(
                name: "FK_Items_Categories_CategoryId",
                table: "Items");

            migrationBuilder.DropForeignKey(
                name: "FK_SourcingGroups_Categories_CategoryId",
                table: "SourcingGroups");

            migrationBuilder.DropForeignKey(
                name: "FK_PrLines_Items_ItemId",
                table: "PrLines");

            migrationBuilder.DropForeignKey(
                name: "FK_PrLines_Units_UnitId",
                table: "PrLines");

            migrationBuilder.DropForeignKey(
                name: "FK_QuotationLines_PrLines_PrLineId",
                table: "QuotationLines");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotations_SourcingGroups_SourcingGroupId",
                table: "Quotations");

            migrationBuilder.DropTable(
                name: "ActionTypes");

            migrationBuilder.DropTable(
                name: "AdvanceTypes");

            migrationBuilder.DropTable(
                name: "AiChecks");

            migrationBuilder.DropTable(
                name: "AiCheckTypes");

            migrationBuilder.DropTable(
                name: "AmendmentTypes");

            migrationBuilder.DropTable(
                name: "ApprovalBands");

            migrationBuilder.DropTable(
                name: "ApprovalRequestStatuses");

            migrationBuilder.DropTable(
                name: "AuditEvents");

            migrationBuilder.DropTable(
                name: "AuditQueries");

            migrationBuilder.DropTable(
                name: "AuditStamps");

            migrationBuilder.DropTable(
                name: "ClauseCategories");

            migrationBuilder.DropTable(
                name: "CommentTypes");

            migrationBuilder.DropTable(
                name: "ContractClauses");

            migrationBuilder.DropTable(
                name: "Contracts");

            migrationBuilder.DropTable(
                name: "ContractTypes");

            migrationBuilder.DropTable(
                name: "CostTypes");

            migrationBuilder.DropTable(
                name: "DepartmentCategories");

            migrationBuilder.DropTable(
                name: "DispatchChannels");

            migrationBuilder.DropTable(
                name: "DocumentLinks");

            migrationBuilder.DropTable(
                name: "DocumentTypes");

            migrationBuilder.DropTable(
                name: "EntityTypes");

            migrationBuilder.DropTable(
                name: "GoodsReceiptLines");

            migrationBuilder.DropTable(
                name: "ItemRequests");

            migrationBuilder.DropTable(
                name: "MonthEndAuditItems");

            migrationBuilder.DropTable(
                name: "MonthEndAuditStatuses");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "NotificationTypes");

            migrationBuilder.DropTable(
                name: "OccurrenceStatuses");

            migrationBuilder.DropTable(
                name: "OutboxMessages");

            migrationBuilder.DropTable(
                name: "PoAmendments");

            migrationBuilder.DropTable(
                name: "PolicySettings");

            migrationBuilder.DropTable(
                name: "PoStatuses");

            migrationBuilder.DropTable(
                name: "PoTypes");

            migrationBuilder.DropTable(
                name: "PrBills");

            migrationBuilder.DropTable(
                name: "PrBudgetChecks");

            migrationBuilder.DropTable(
                name: "PrComments");

            migrationBuilder.DropTable(
                name: "ProcurementModes");

            migrationBuilder.DropTable(
                name: "PrStatuses");

            migrationBuilder.DropTable(
                name: "QueryStatuses");

            migrationBuilder.DropTable(
                name: "RecurringFrequencies");

            migrationBuilder.DropTable(
                name: "RecurringPlanLines");

            migrationBuilder.DropTable(
                name: "RecurringPlanTypes");

            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "SecurityDepositStatuses");

            migrationBuilder.DropTable(
                name: "StageTypes");

            migrationBuilder.DropTable(
                name: "TaskStatuses");

            migrationBuilder.DropTable(
                name: "UserDepartmentAccess");

            migrationBuilder.DropTable(
                name: "UserRoleAssignments");

            migrationBuilder.DropTable(
                name: "VendorBankAccounts");

            migrationBuilder.DropTable(
                name: "VendorCategories");

            migrationBuilder.DropTable(
                name: "VendorContacts");

            migrationBuilder.DropTable(
                name: "VendorDocuments");

            migrationBuilder.DropTable(
                name: "VendorRegistrationRequests");

            migrationBuilder.DropTable(
                name: "VendorStatuses");

            migrationBuilder.DropTable(
                name: "WorkflowActions");

            migrationBuilder.DropTable(
                name: "ContractTemplates");

            migrationBuilder.DropTable(
                name: "GoodsReceipts");

            migrationBuilder.DropTable(
                name: "PoLines");

            migrationBuilder.DropTable(
                name: "MonthEndAudits");

            migrationBuilder.DropTable(
                name: "SupplierInvoices");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropTable(
                name: "WorkflowTasks");

            migrationBuilder.DropTable(
                name: "PurchaseOrders");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "PolicyVersions");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "PurchaseRequisitions");

            migrationBuilder.DropTable(
                name: "Projects");

            migrationBuilder.DropTable(
                name: "RecurringOccurrences");

            migrationBuilder.DropTable(
                name: "WorkflowInstances");

            migrationBuilder.DropTable(
                name: "RecurringPlans");

            migrationBuilder.DropTable(
                name: "WorkflowStages");

            migrationBuilder.DropTable(
                name: "Departments");

            migrationBuilder.DropTable(
                name: "Documents");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "Items");

            migrationBuilder.DropTable(
                name: "Units");

            migrationBuilder.DropTable(
                name: "PrLines");

            migrationBuilder.DropTable(
                name: "Locations");

            migrationBuilder.DropTable(
                name: "QuotationLines");

            migrationBuilder.DropTable(
                name: "SourcingGroups");

            migrationBuilder.DropTable(
                name: "QuotationRules");

            migrationBuilder.DropTable(
                name: "Quotations");

            migrationBuilder.DropTable(
                name: "SpendSubHeads");

            migrationBuilder.DropTable(
                name: "Currencies");

            migrationBuilder.DropTable(
                name: "Vendors");

            migrationBuilder.DropTable(
                name: "SpendHeads");

            migrationBuilder.DropTable(
                name: "WorkflowDefinitions");
        }
    }
}
