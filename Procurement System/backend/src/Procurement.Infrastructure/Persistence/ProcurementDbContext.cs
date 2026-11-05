using Microsoft.EntityFrameworkCore;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence;

public class ProcurementDbContext : DbContext
{
    public ProcurementDbContext(DbContextOptions<ProcurementDbContext> options) : base(options) { }

    // Lookups
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

    // Identity & Org
    public DbSet<Departments> Departments => Set<Departments>();
    public DbSet<Locations> Locations => Set<Locations>();
    public DbSet<Users> Users => Set<Users>();
    public DbSet<Roles> Roles => Set<Roles>();
    public DbSet<Permissions> Permissions => Set<Permissions>();
    public DbSet<RolePermissions> RolePermissions => Set<RolePermissions>();
    public DbSet<UserRoleAssignments> UserRoleAssignments => Set<UserRoleAssignments>();
    public DbSet<UserDepartmentAccess> UserDepartmentAccess => Set<UserDepartmentAccess>();

    // Catalog & Projects
    public DbSet<SpendHeads> SpendHeads => Set<SpendHeads>();
    public DbSet<SpendSubHeads> SpendSubHeads => Set<SpendSubHeads>();
    public DbSet<Units> Units => Set<Units>();
    public DbSet<Categories> Categories => Set<Categories>();
    public DbSet<Items> Items => Set<Items>();
    public DbSet<ItemRequests> ItemRequests => Set<ItemRequests>();
    public DbSet<Projects> Projects => Set<Projects>();
    public DbSet<DepartmentCategories> DepartmentCategories => Set<DepartmentCategories>();

    // Policy
    public DbSet<PolicyVersions> PolicyVersions => Set<PolicyVersions>();
    public DbSet<ApprovalBands> ApprovalBands => Set<ApprovalBands>();
    public DbSet<QuotationRules> QuotationRules => Set<QuotationRules>();
    public DbSet<PolicySettings> PolicySettings => Set<PolicySettings>();

    // Workflow Engine
    public DbSet<WorkflowDefinitions> WorkflowDefinitions => Set<WorkflowDefinitions>();
    public DbSet<WorkflowStages> WorkflowStages => Set<WorkflowStages>();
    public DbSet<WorkflowInstances> WorkflowInstances => Set<WorkflowInstances>();
    public DbSet<WorkflowTasks> WorkflowTasks => Set<WorkflowTasks>();
    public DbSet<WorkflowActions> WorkflowActions => Set<WorkflowActions>();

    // Documents
    public DbSet<Documents> Documents => Set<Documents>();
    public DbSet<DocumentLinks> DocumentLinks => Set<DocumentLinks>();

    // Vendors
    public DbSet<Vendors> Vendors => Set<Vendors>();
    public DbSet<VendorCategories> VendorCategories => Set<VendorCategories>();
    public DbSet<VendorContacts> VendorContacts => Set<VendorContacts>();
    public DbSet<VendorBankAccounts> VendorBankAccounts => Set<VendorBankAccounts>();
    public DbSet<VendorDocuments> VendorDocuments => Set<VendorDocuments>();
    public DbSet<VendorRegistrationRequests> VendorRegistrationRequests => Set<VendorRegistrationRequests>();

    // Purchase Requisition
    public DbSet<PurchaseRequisitions> PurchaseRequisitions => Set<PurchaseRequisitions>();
    public DbSet<PrLines> PrLines => Set<PrLines>();
    public DbSet<PrBills> PrBills => Set<PrBills>();
    public DbSet<PrComments> PrComments => Set<PrComments>();
    public DbSet<PrBudgetChecks> PrBudgetChecks => Set<PrBudgetChecks>();

    // Sourcing
    public DbSet<Quotations> Quotations => Set<Quotations>();
    public DbSet<QuotationLines> QuotationLines => Set<QuotationLines>();
    public DbSet<SourcingGroups> SourcingGroups => Set<SourcingGroups>();
    public DbSet<AiChecks> AiChecks => Set<AiChecks>();

    // Purchasing & Contracts
    public DbSet<PurchaseOrders> PurchaseOrders => Set<PurchaseOrders>();
    public DbSet<PoLines> PoLines => Set<PoLines>();
    public DbSet<Contracts> Contracts => Set<Contracts>();
    public DbSet<PoAmendments> PoAmendments => Set<PoAmendments>();
    public DbSet<ContractTemplates> ContractTemplates => Set<ContractTemplates>();
    public DbSet<ContractClauses> ContractClauses => Set<ContractClauses>();

    // Receiving
    public DbSet<GoodsReceipts> GoodsReceipts => Set<GoodsReceipts>();
    public DbSet<GoodsReceiptLines> GoodsReceiptLines => Set<GoodsReceiptLines>();

    // Bills
    public DbSet<SupplierInvoices> SupplierInvoices => Set<SupplierInvoices>();

    // Audit & Compliance
    public DbSet<AuditQueries> AuditQueries => Set<AuditQueries>();
    public DbSet<AuditEvents> AuditEvents => Set<AuditEvents>();
    public DbSet<AuditStamps> AuditStamps => Set<AuditStamps>();
    public DbSet<MonthEndAudits> MonthEndAudits => Set<MonthEndAudits>();
    public DbSet<MonthEndAuditItems> MonthEndAuditItems => Set<MonthEndAuditItems>();

    // Recurring
    public DbSet<RecurringPlans> RecurringPlans => Set<RecurringPlans>();
    public DbSet<RecurringPlanLines> RecurringPlanLines => Set<RecurringPlanLines>();
    public DbSet<RecurringOccurrences> RecurringOccurrences => Set<RecurringOccurrences>();

    // Notifications
    public DbSet<Notifications> Notifications => Set<Notifications>();
    public DbSet<OutboxMessages> OutboxMessages => Set<OutboxMessages>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<decimal>().HaveColumnType("decimal(18,2)");
        configurationBuilder.Properties<DateOnly>().HaveColumnType("date");
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Currencies>().HasKey(c => c.Code);
        modelBuilder.Entity<Currencies>().Property(c => c.Code).HasMaxLength(3);

        var lookupBaseType = typeof(Domain.Entities.LookupEntity);
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (lookupBaseType.IsAssignableFrom(entityType.ClrType) && entityType.ClrType != lookupBaseType)
            {
                modelBuilder.Entity(entityType.ClrType).HasIndex(nameof(Domain.Entities.LookupEntity.Code)).IsUnique();
            }
        }

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ProcurementDbContext).Assembly);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var fk in entityType.GetForeignKeys())
            {
                fk.DeleteBehavior = DeleteBehavior.Restrict;
            }
        }

        base.OnModelCreating(modelBuilder);
    }
}
