using Microsoft.EntityFrameworkCore;
using Procurement.Domain.Entities;

namespace Procurement.Application.Common.Interfaces;

public interface IProcurementDbContext
{
    // Lookups
    DbSet<PrStatuses> PrStatuses { get; }
    DbSet<CostTypes> CostTypes { get; }
    DbSet<ProcurementModes> ProcurementModes { get; }
    DbSet<PoTypes> PoTypes { get; }
    DbSet<PoStatuses> PoStatuses { get; }
    DbSet<VendorStatuses> VendorStatuses { get; }
    DbSet<ApprovalRequestStatuses> ApprovalRequestStatuses { get; }
    DbSet<TaskStatuses> TaskStatuses { get; }
    DbSet<ActionTypes> ActionTypes { get; }
    DbSet<StageTypes> StageTypes { get; }
    DbSet<DocumentTypes> DocumentTypes { get; }
    DbSet<RecurringFrequencies> RecurringFrequencies { get; }
    DbSet<RecurringPlanTypes> RecurringPlanTypes { get; }
    DbSet<OccurrenceStatuses> OccurrenceStatuses { get; }
    DbSet<QueryStatuses> QueryStatuses { get; }
    DbSet<DispatchChannels> DispatchChannels { get; }
    DbSet<ContractTypes> ContractTypes { get; }
    DbSet<CommentTypes> CommentTypes { get; }
    DbSet<Currencies> Currencies { get; }
    DbSet<NotificationTypes> NotificationTypes { get; }
    DbSet<ClauseCategories> ClauseCategories { get; }
    DbSet<AmendmentTypes> AmendmentTypes { get; }
    DbSet<SecurityDepositStatuses> SecurityDepositStatuses { get; }
    DbSet<AdvanceTypes> AdvanceTypes { get; }
    DbSet<AiCheckTypes> AiCheckTypes { get; }
    DbSet<MonthEndAuditStatuses> MonthEndAuditStatuses { get; }
    DbSet<EntityTypes> EntityTypes { get; }
    // Identity & Org
    DbSet<Departments> Departments { get; }
    DbSet<Locations> Locations { get; }
    DbSet<Users> Users { get; }
    DbSet<Roles> Roles { get; }
    DbSet<Permissions> Permissions { get; }
    DbSet<RolePermissions> RolePermissions { get; }
    DbSet<UserRoleAssignments> UserRoleAssignments { get; }
    DbSet<UserDepartmentAccess> UserDepartmentAccess { get; }
    // Catalog & Projects
    DbSet<SpendHeads> SpendHeads { get; }
    DbSet<SpendSubHeads> SpendSubHeads { get; }
    DbSet<Units> Units { get; }
    DbSet<Categories> Categories { get; }
    DbSet<Items> Items { get; }
    DbSet<ItemRequests> ItemRequests { get; }
    DbSet<Projects> Projects { get; }
    DbSet<DepartmentCategories> DepartmentCategories { get; }
    // Policy
    DbSet<PolicyVersions> PolicyVersions { get; }
    DbSet<ApprovalBands> ApprovalBands { get; }
    DbSet<QuotationRules> QuotationRules { get; }
    DbSet<PolicySettings> PolicySettings { get; }
    // Workflow Engine
    DbSet<WorkflowDefinitions> WorkflowDefinitions { get; }
    DbSet<WorkflowStages> WorkflowStages { get; }
    DbSet<WorkflowInstances> WorkflowInstances { get; }
    DbSet<WorkflowTasks> WorkflowTasks { get; }
    DbSet<WorkflowActions> WorkflowActions { get; }
    // Documents
    DbSet<Documents> Documents { get; }
    DbSet<DocumentLinks> DocumentLinks { get; }
    // Vendors
    DbSet<Vendors> Vendors { get; }
    DbSet<VendorCategories> VendorCategories { get; }
    DbSet<VendorContacts> VendorContacts { get; }
    DbSet<VendorBankAccounts> VendorBankAccounts { get; }
    DbSet<VendorDocuments> VendorDocuments { get; }
    DbSet<VendorRegistrationRequests> VendorRegistrationRequests { get; }
    // Purchase Requisition
    DbSet<PurchaseRequisitions> PurchaseRequisitions { get; }
    DbSet<PrLines> PrLines { get; }
    DbSet<PrBills> PrBills { get; }
    DbSet<PrComments> PrComments { get; }
    DbSet<PrBudgetChecks> PrBudgetChecks { get; }
    // Sourcing
    DbSet<Quotations> Quotations { get; }
    DbSet<QuotationLines> QuotationLines { get; }
    DbSet<SourcingGroups> SourcingGroups { get; }
    DbSet<AiChecks> AiChecks { get; }
    // Purchasing & Contracts
    DbSet<PurchaseOrders> PurchaseOrders { get; }
    DbSet<PoLines> PoLines { get; }
    DbSet<Contracts> Contracts { get; }
    DbSet<PoAmendments> PoAmendments { get; }
    DbSet<ContractTemplates> ContractTemplates { get; }
    DbSet<ContractClauses> ContractClauses { get; }
    // Receiving
    DbSet<GoodsReceipts> GoodsReceipts { get; }
    DbSet<GoodsReceiptLines> GoodsReceiptLines { get; }
    // Bills
    DbSet<SupplierInvoices> SupplierInvoices { get; }
    // Audit & Compliance
    DbSet<AuditQueries> AuditQueries { get; }
    DbSet<AuditEvents> AuditEvents { get; }
    DbSet<AuditStamps> AuditStamps { get; }
    DbSet<MonthEndAudits> MonthEndAudits { get; }
    DbSet<MonthEndAuditItems> MonthEndAuditItems { get; }
    // Recurring
    DbSet<RecurringPlans> RecurringPlans { get; }
    DbSet<RecurringPlanLines> RecurringPlanLines { get; }
    DbSet<RecurringOccurrences> RecurringOccurrences { get; }
    // Notifications
    DbSet<Notifications> Notifications { get; }
    DbSet<OutboxMessages> OutboxMessages { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
