using Microsoft.EntityFrameworkCore;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

public static partial class DbSeeder
{
    private static async Task SeedLookupsAsync(ProcurementDbContext db)
    {
        await SeedHelpers.SeedTerminalLookupAsync(db, db.PrStatuses, new (string, bool)[]
        {
            ("Draft", false), ("AwaitingBill", false), ("PendingHod", false), ("PendingFinance", false),
            ("PendingAudit", false), ("PendingOpd", false), ("PendingProcurement", false), ("PendingQuotations", false),
            ("PendingQuoteReview", false), ("PoPreparation", false), ("PoIssued", false), ("PartiallyReceived", false),
            ("AwaitingAcknowledgement", false), ("BillPending", false), ("WithFinancePortal", false), ("AuditReview", false),
            ("Queried", false), ("Returned", false), ("OnHold", false), ("Closed", true), ("Rejected", true), ("Cancelled", true),
        });

        await SeedHelpers.SeedLookupAsync(db, db.CostTypes, new[] { "Final", "Tentative" });
        await SeedHelpers.SeedLookupAsync(db, db.ProcurementModes, new[] { "Bill", "PolicyClaim", "RecurringBill", "RecurringItems", "Sourcing" });
        await SeedHelpers.SeedLookupAsync(db, db.PoTypes, new[] { "Standard", "Manual", "Recurring" });

        await SeedHelpers.SeedTerminalLookupAsync(db, db.PoStatuses, new (string, bool)[]
        {
            ("Draft", false), ("Issued", false), ("AwaitingContract", false), ("Active", false),
            ("PartiallyReceived", false), ("Received", false), ("ShortClosed", true), ("Cancelled", true), ("Closed", true),
        });

        await SeedHelpers.SeedTerminalLookupAsync(db, db.VendorStatuses, new (string, bool)[]
        {
            ("Approved", false), ("Suspended", false), ("Blacklisted", true), ("Inactive", false),
        });

        await SeedHelpers.SeedTerminalLookupAsync(db, db.ApprovalRequestStatuses, new (string, bool)[]
        {
            ("Draft", false), ("PendingProcurement", false), ("PendingProcurementHod", false), ("PendingFinance", false),
            ("PendingAudit", false), ("PendingOpd", false), ("Approved", true), ("Rejected", true), ("Returned", false), ("Cancelled", true),
        });

        await SeedHelpers.SeedTerminalLookupAsync(db, db.TaskStatuses, new (string, bool)[]
        {
            ("Open", false), ("Completed", true), ("Cancelled", true), ("Escalated", false),
        });

        await SeedHelpers.SeedLookupAsync(db, db.ActionTypes, new[]
        {
            "Submit", "Approve", "Reject", "Return", "Query", "Respond", "Complete", "Skip",
            "Hold", "Release", "Override", "ForceRevert", "Void", "Cancel", "Close",
        });

        await SeedHelpers.SeedLookupAsync(db, db.StageTypes, new[] { "Approval", "Operational", "Review", "Exception", "Closure" });

        await SeedHelpers.SeedLookupAsync(db, db.DocumentTypes, new[]
        {
            "Bill", "SupportingDoc", "Quotation", "Contract", "SignedContract", "SecurityCheque", "Invoice",
            "PaymentProof", "GrnNote", "VendorNtn", "VendorBankLetter", "Other", "DeliveryNote", "ContractAnnex",
        });

        await SeedHelpers.SeedLookupAsync(db, db.RecurringFrequencies, new[] { "Monthly", "Quarterly", "HalfYearly", "Yearly" });
        await SeedHelpers.SeedLookupAsync(db, db.RecurringPlanTypes, new[] { "Bill", "Items" });
        await SeedHelpers.SeedLookupAsync(db, db.OccurrenceStatuses, new[] { "Scheduled", "Generated", "Skipped", "Failed" });

        await SeedHelpers.SeedTerminalLookupAsync(db, db.QueryStatuses, new (string, bool)[]
        {
            ("Open", false), ("Responded", false), ("Closed", true),
        });

        await SeedHelpers.SeedLookupAsync(db, db.DispatchChannels, new[] { "Email", "WhatsApp", "Manual" });
        await SeedHelpers.SeedLookupAsync(db, db.ContractTypes, new[] { "Supply", "Service", "ProjectSupplied" });
        await SeedHelpers.SeedLookupAsync(db, db.CommentTypes, new[] { "Note", "Query", "Response" });

        if (!await db.Currencies.AnyAsync())
        {
            db.Currencies.AddRange(
                new Currencies { Code = "PKR", Name = "Pakistani Rupee", IsActive = true },
                new Currencies { Code = "USD", Name = "US Dollar", IsActive = true },
                new Currencies { Code = "AED", Name = "UAE Dirham", IsActive = true });
            await db.SaveChangesAsync();
        }

        await SeedHelpers.SeedLookupAsync(db, db.NotificationTypes, new[]
        {
            "ActionRequired", "HighQuoteAlert", "Escalation", "DuplicateItemBlocked",
            "VendorDecision", "PoTermsChanged", "PaymentConfirmed", "AuditQuery",
        });

        await SeedHelpers.SeedLookupAsync(db, db.ClauseCategories, new[]
        {
            "Scope", "Delivery", "Import & Customs", "Payment", "Advance", "Warranty", "Penalty",
            "Security Deposit", "Governing Law", "Dispute Resolution", "Termination", "Confidentiality",
        });

        await SeedHelpers.SeedLookupAsync(db, db.AmendmentTypes, new[] { "Price", "Quantity", "DeliveryDate", "PaymentTerms", "OtherTerms" });

        await SeedHelpers.SeedTerminalLookupAsync(db, db.SecurityDepositStatuses, new (string, bool)[]
        {
            ("Held", false), ("Returned", true), ("Encashed", true),
        });

        await SeedHelpers.SeedLookupAsync(db, db.AdvanceTypes, new[] { "None", "Percent", "Amount" });
        await SeedHelpers.SeedLookupAsync(db, db.AiCheckTypes, new[] { "DuplicateItemLocation", "SplitPurchase", "MarketPrice", "HighQuote" });

        await SeedHelpers.SeedTerminalLookupAsync(db, db.MonthEndAuditStatuses, new (string, bool)[]
        {
            ("Open", false), ("InReview", false), ("Completed", true),
        });

        if (!await db.EntityTypes.AnyAsync())
        {
            var entityTypes = new[]
            {
                ("PurchaseRequisition", "PurchaseRequisitions"), ("PrLine", "PrLines"), ("PurchaseOrder", "PurchaseOrders"),
                ("GoodsReceipt", "GoodsReceipts"), ("SupplierInvoice", "SupplierInvoices"), ("Contract", "Contracts"),
                ("Quotation", "Quotations"), ("Vendor", "Vendors"), ("VendorRegistrationRequest", "VendorRegistrationRequests"),
                ("RecurringPlan", "RecurringPlans"), ("ItemRequest", "ItemRequests"), ("PolicyVersion", "PolicyVersions"), ("User", "Users"),
            };
            short sort = 1;
            foreach (var (code, table) in entityTypes)
            {
                db.EntityTypes.Add(new EntityTypes { Id = sort, Code = code, Name = SeedHelpers.Humanize(code), SortOrder = sort, IsActive = true, TableName = table });
                sort++;
            }
            await db.SaveChangesAsync();
        }
    }
}
