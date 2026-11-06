using Microsoft.EntityFrameworkCore;
using Procurement.Domain.Entities;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Infrastructure.Persistence;

public class ProcurementDbContext : DbContext, IApplicationDbContext
{
    public ProcurementDbContext(DbContextOptions<ProcurementDbContext> options) : base(options) { }

    public DbSet<PrStatuses> PrStatuses => Set<PrStatuses>();
    public DbSet<CostTypes> CostTypes => Set<CostTypes>();
    public DbSet<ProcurementModes> ProcurementModes => Set<ProcurementModes>();
    public DbSet<PoTypes> PoTypes => Set<PoTypes>();
    public DbSet<PoStatuses> PoStatuses => Set<PoStatuses>();
    public DbSet<VendorStatuses> VendorStatuses => Set<VendorStatuses>();
    public DbSet<ApprovalRequestStatuses> ApprovalRequestStatuses => Set<ApprovalRequestStatuses>();
    public DbSet<TaskStatuses> TaskStatuses => Set<TaskStatuses>();
    public DbSet<ActionTypes> ActionTypes => Set<ActionTypes>();
    public DbSet<StageTypes> StageTypes => Set<StageTypes>();
    public DbSet<DocumentTypes> DocumentTypes => Set<DocumentTypes>();
    public DbSet<RecurringFrequencies> RecurringFrequencies => Set<RecurringFrequencies>();
    public DbSet<RecurringPlanTypes> RecurringPlanTypes => Set<RecurringPlanTypes>();
    public DbSet<OccurrenceStatuses> OccurrenceStatuses => Set<OccurrenceStatuses>();
    public DbSet<QueryStatuses> QueryStatuses => Set<QueryStatuses>();
    public DbSet<DispatchChannels> DispatchChannels => Set<DispatchChannels>();
    public DbSet<ContractTypes> ContractTypes => Set<ContractTypes>();
    public DbSet<CommentTypes> CommentTypes => Set<CommentTypes>();
    public DbSet<Currencies> Currencies => Set<Currencies>();
    public DbSet<NotificationTypes> NotificationTypes => Set<NotificationTypes>();
    public DbSet<ClauseCategories> ClauseCategories => Set<ClauseCategories>();
    public DbSet<AmendmentTypes> AmendmentTypes => Set<AmendmentTypes>();
    public DbSet<SecurityDepositStatuses> SecurityDepositStatuses => Set<SecurityDepositStatuses>();
    public DbSet<AdvanceTypes> AdvanceTypes => Set<AdvanceTypes>();
    public DbSet<AiCheckTypes> AiCheckTypes => Set<AiCheckTypes>();
    public DbSet<MonthEndAuditStatuses> MonthEndAuditStatuses => Set<MonthEndAuditStatuses>();
    public DbSet<EntityTypes> EntityTypes => Set<EntityTypes>();
    public DbSet<Departments> Departments => Set<Departments>();
    public DbSet<Locations> Locations => Set<Locations>();
    public DbSet<Users> Users => Set<Users>();
    public DbSet<Roles> Roles => Set<Roles>();
    public DbSet<Permissions> Permissions => Set<Permissions>();
    public DbSet<RolePermissions> RolePermissions => Set<RolePermissions>();
    public DbSet<UserRoleAssignments> UserRoleAssignments => Set<UserRoleAssignments>();
    public DbSet<UserDepartmentAccess> UserDepartmentAccess => Set<UserDepartmentAccess>();
    public DbSet<SpendHeads> SpendHeads => Set<SpendHeads>();
    public DbSet<SpendSubHeads> SpendSubHeads => Set<SpendSubHeads>();
    public DbSet<Units> Units => Set<Units>();
    public DbSet<Categories> Categories => Set<Categories>();
    public DbSet<Items> Items => Set<Items>();
    public DbSet<ItemRequests> ItemRequests => Set<ItemRequests>();
    public DbSet<Projects> Projects => Set<Projects>();
    public DbSet<DepartmentCategories> DepartmentCategories => Set<DepartmentCategories>();
    public DbSet<MarketSurveys> MarketSurveys => Set<MarketSurveys>();
    public DbSet<PolicyVersions> PolicyVersions => Set<PolicyVersions>();
    public DbSet<ApprovalBands> ApprovalBands => Set<ApprovalBands>();
    public DbSet<QuotationRules> QuotationRules => Set<QuotationRules>();
    public DbSet<PolicySettings> PolicySettings => Set<PolicySettings>();
    public DbSet<WorkflowDefinitions> WorkflowDefinitions => Set<WorkflowDefinitions>();
    public DbSet<WorkflowStages> WorkflowStages => Set<WorkflowStages>();
    public DbSet<WorkflowInstances> WorkflowInstances => Set<WorkflowInstances>();
    public DbSet<WorkflowTasks> WorkflowTasks => Set<WorkflowTasks>();
    public DbSet<WorkflowActions> WorkflowActions => Set<WorkflowActions>();
    public DbSet<Documents> Documents => Set<Documents>();
    public DbSet<DocumentLinks> DocumentLinks => Set<DocumentLinks>();
    public DbSet<Vendors> Vendors => Set<Vendors>();
    public DbSet<VendorCategories> VendorCategories => Set<VendorCategories>();
    public DbSet<VendorContacts> VendorContacts => Set<VendorContacts>();
    public DbSet<VendorBankAccounts> VendorBankAccounts => Set<VendorBankAccounts>();
    public DbSet<VendorDocuments> VendorDocuments => Set<VendorDocuments>();
    public DbSet<VendorRegistrationRequests> VendorRegistrationRequests => Set<VendorRegistrationRequests>();
    public DbSet<PurchaseRequisitions> PurchaseRequisitions => Set<PurchaseRequisitions>();
    public DbSet<PrLines> PrLines => Set<PrLines>();
    public DbSet<PrBills> PrBills => Set<PrBills>();
    public DbSet<PrComments> PrComments => Set<PrComments>();
    public DbSet<Quotations> Quotations => Set<Quotations>();
    public DbSet<QuotationLines> QuotationLines => Set<QuotationLines>();
    public DbSet<SourcingGroups> SourcingGroups => Set<SourcingGroups>();
    public DbSet<AiChecks> AiChecks => Set<AiChecks>();
    public DbSet<PurchaseOrders> PurchaseOrders => Set<PurchaseOrders>();
    public DbSet<PoLines> PoLines => Set<PoLines>();
    public DbSet<Contracts> Contracts => Set<Contracts>();
    public DbSet<PoAmendments> PoAmendments => Set<PoAmendments>();
    public DbSet<ContractTemplates> ContractTemplates => Set<ContractTemplates>();
    public DbSet<ContractClauses> ContractClauses => Set<ContractClauses>();
    public DbSet<GoodsReceipts> GoodsReceipts => Set<GoodsReceipts>();
    public DbSet<GoodsReceiptLines> GoodsReceiptLines => Set<GoodsReceiptLines>();
    public DbSet<SupplierInvoices> SupplierInvoices => Set<SupplierInvoices>();
    public DbSet<AuditQueries> AuditQueries => Set<AuditQueries>();
    public DbSet<AuditEvents> AuditEvents => Set<AuditEvents>();
    public DbSet<AuditStamps> AuditStamps => Set<AuditStamps>();
    public DbSet<MonthEndAudits> MonthEndAudits => Set<MonthEndAudits>();
    public DbSet<MonthEndAuditItems> MonthEndAuditItems => Set<MonthEndAuditItems>();
    public DbSet<RecurringPlans> RecurringPlans => Set<RecurringPlans>();
    public DbSet<RecurringPlanLines> RecurringPlanLines => Set<RecurringPlanLines>();
    public DbSet<RecurringOccurrences> RecurringOccurrences => Set<RecurringOccurrences>();
    public DbSet<Notifications> Notifications => Set<Notifications>();
    public DbSet<OutboxMessages> OutboxMessages => Set<OutboxMessages>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ProcurementDbContext).Assembly);

        // Every AuditableEntity gets CreatedBy/UpdatedBy -> Users.Id, configured once here
        // instead of repeating it in every generated *Configuration class.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(Procurement.Domain.Common.AuditableEntity).IsAssignableFrom(entityType.ClrType)) continue;

            // Self-referencing on Users (who created/updated this user) is fine: SQL Server
            // checks FK constraints at statement completion, so a bootstrap admin row can
            // reference its own just-inserted Id in the same INSERT.
            modelBuilder.Entity(entityType.ClrType)
                .HasOne(typeof(Users)).WithMany()
                .HasForeignKey("CreatedBy")
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired();

            modelBuilder.Entity(entityType.ClrType)
                .HasOne(typeof(Users)).WithMany()
                .HasForeignKey("UpdatedBy")
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);
        }

        // Document numbering sequences (PR-/PO-/MPO-/GRN-/INV-/VR-/RP- + year), read via
        // IDocumentNumberGenerator - never generated client-side.
        modelBuilder.HasSequence<int>("seq_pr").StartsAt(1).IncrementsBy(1);
        modelBuilder.HasSequence<int>("seq_po").StartsAt(1).IncrementsBy(1);
        modelBuilder.HasSequence<int>("seq_mpo").StartsAt(1).IncrementsBy(1);
        modelBuilder.HasSequence<int>("seq_grn").StartsAt(1).IncrementsBy(1);
        modelBuilder.HasSequence<int>("seq_inv").StartsAt(1).IncrementsBy(1);
        modelBuilder.HasSequence<int>("seq_vr").StartsAt(1).IncrementsBy(1);
        modelBuilder.HasSequence<int>("seq_rp").StartsAt(1).IncrementsBy(1);
    }
}
