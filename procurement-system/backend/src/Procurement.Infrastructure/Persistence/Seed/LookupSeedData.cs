namespace Procurement.Infrastructure.Persistence.Seed;

public record LookupRow(string Code, string Name, short SortOrder, bool IsTerminal);
public record LookupSeed(string TableName, LookupRow[] Rows);

// Generated from tools/schema/schema.js - do not hand-edit; re-run generate.js instead.
public static class LookupSeedData
{
    public static IEnumerable<LookupSeed> All()
    {
        yield return new LookupSeed("PrStatuses", new LookupRow[] {
            new("Draft", "Draft", 10, false),
            new("AwaitingBill", "Awaiting Bill", 20, false),
            new("PendingHod", "Pending Hod", 30, false),
            new("PendingFinance", "Pending Finance", 40, false),
            new("PendingAudit", "Pending Audit", 50, false),
            new("PendingOpd", "Pending Opd", 60, false),
            new("PendingProcurement", "Pending Procurement", 70, false),
            new("PendingQuotations", "Pending Quotations", 80, false),
            new("PendingQuoteReview", "Pending Quote Review", 90, false),
            new("PoPreparation", "Po Preparation", 100, false),
            new("PoIssued", "Po Issued", 110, false),
            new("PartiallyReceived", "Partially Received", 120, false),
            new("AwaitingAcknowledgement", "Awaiting Acknowledgement", 130, false),
            new("BillPending", "Bill Pending", 140, false),
            new("WithFinancePortal", "With Finance Portal", 150, false),
            new("AuditReview", "Audit Review", 160, false),
            new("Queried", "Queried", 170, false),
            new("Returned", "Returned", 180, false),
            new("OnHold", "On Hold", 190, false),
            new("Closed", "Closed", 200, true),
            new("Rejected", "Rejected", 210, true),
            new("Cancelled", "Cancelled", 220, true),
        });
        yield return new LookupSeed("CostTypes", new LookupRow[] {
            new("Final", "Final", 10, false),
            new("Tentative", "Tentative", 20, false),
        });
        yield return new LookupSeed("ProcurementModes", new LookupRow[] {
            new("Bill", "Bill", 10, false),
            new("PolicyClaim", "Policy Claim", 20, false),
            new("RecurringBill", "Recurring Bill", 30, false),
            new("RecurringItems", "Recurring Items", 40, false),
            new("Sourcing", "Sourcing", 50, false),
        });
        yield return new LookupSeed("PoTypes", new LookupRow[] {
            new("Standard", "Standard", 10, false),
            new("Manual", "Manual", 20, false),
            new("Recurring", "Recurring", 30, false),
        });
        yield return new LookupSeed("PoStatuses", new LookupRow[] {
            new("Draft", "Draft", 10, false),
            new("Issued", "Issued", 20, false),
            new("AwaitingContract", "Awaiting Contract", 30, false),
            new("Active", "Active", 40, false),
            new("PartiallyReceived", "Partially Received", 50, false),
            new("Received", "Received", 60, false),
            new("ShortClosed", "Short Closed", 70, true),
            new("Cancelled", "Cancelled", 80, true),
            new("Closed", "Closed", 90, true),
        });
        yield return new LookupSeed("VendorStatuses", new LookupRow[] {
            new("Approved", "Approved", 10, false),
            new("Suspended", "Suspended", 20, false),
            new("Blacklisted", "Blacklisted", 30, true),
            new("Inactive", "Inactive", 40, false),
        });
        yield return new LookupSeed("ApprovalRequestStatuses", new LookupRow[] {
            new("Draft", "Draft", 10, false),
            new("PendingProcurement", "Pending Procurement", 20, false),
            new("PendingProcurementHod", "Pending Procurement Hod", 30, false),
            new("PendingFinance", "Pending Finance", 40, false),
            new("PendingAudit", "Pending Audit", 50, false),
            new("PendingOpd", "Pending Opd", 60, false),
            new("Approved", "Approved", 70, true),
            new("Rejected", "Rejected", 80, true),
            new("Returned", "Returned", 90, false),
            new("Cancelled", "Cancelled", 100, true),
        });
        yield return new LookupSeed("TaskStatuses", new LookupRow[] {
            new("Open", "Open", 10, false),
            new("Completed", "Completed", 20, true),
            new("Cancelled", "Cancelled", 30, true),
            new("Escalated", "Escalated", 40, false),
        });
        yield return new LookupSeed("ActionTypes", new LookupRow[] {
            new("Submit", "Submit", 10, false),
            new("Approve", "Approve", 20, false),
            new("Reject", "Reject", 30, false),
            new("Return", "Return", 40, false),
            new("Query", "Query", 50, false),
            new("Respond", "Respond", 60, false),
            new("Refer", "Refer", 70, false),
            new("Complete", "Complete", 80, false),
            new("Skip", "Skip", 90, false),
            new("Hold", "Hold", 100, false),
            new("Release", "Release", 110, false),
            new("Override", "Override", 120, false),
            new("ForceRevert", "Force Revert", 130, false),
            new("Void", "Void", 140, false),
            new("Cancel", "Cancel", 150, false),
            new("Close", "Close", 160, false),
        });
        yield return new LookupSeed("StageTypes", new LookupRow[] {
            new("Approval", "Approval", 10, false),
            new("Operational", "Operational", 20, false),
            new("Review", "Review", 30, false),
            new("Exception", "Exception", 40, false),
            new("Closure", "Closure", 50, false),
        });
        yield return new LookupSeed("DocumentTypes", new LookupRow[] {
            new("Bill", "Bill", 10, false),
            new("SupportingDoc", "Supporting Doc", 20, false),
            new("Quotation", "Quotation", 30, false),
            new("Contract", "Contract", 40, false),
            new("SignedContract", "Signed Contract", 50, false),
            new("SecurityCheque", "Security Cheque", 60, false),
            new("Invoice", "Invoice", 70, false),
            new("PaymentProof", "Payment Proof", 80, false),
            new("GrnNote", "Grn Note", 90, false),
            new("VendorNtn", "Vendor Ntn", 100, false),
            new("VendorBankLetter", "Vendor Bank Letter", 110, false),
            new("Other", "Other", 120, false),
            new("DeliveryNote", "Delivery Note", 130, false),
            new("ContractAnnex", "Contract Annex", 140, false),
        });
        yield return new LookupSeed("RecurringFrequencies", new LookupRow[] {
            new("Monthly", "Monthly", 10, false),
            new("Quarterly", "Quarterly", 20, false),
            new("HalfYearly", "Half Yearly", 30, false),
            new("Yearly", "Yearly", 40, false),
        });
        yield return new LookupSeed("RecurringPlanTypes", new LookupRow[] {
            new("Bill", "Bill", 10, false),
            new("Items", "Items", 20, false),
        });
        yield return new LookupSeed("OccurrenceStatuses", new LookupRow[] {
            new("Scheduled", "Scheduled", 10, false),
            new("Generated", "Generated", 20, false),
            new("Skipped", "Skipped", 30, false),
            new("Failed", "Failed", 40, false),
        });
        yield return new LookupSeed("QueryStatuses", new LookupRow[] {
            new("Open", "Open", 10, false),
            new("Responded", "Responded", 20, false),
            new("Closed", "Closed", 30, true),
        });
        yield return new LookupSeed("DispatchChannels", new LookupRow[] {
            new("Email", "Email", 10, false),
            new("WhatsApp", "Whats App", 20, false),
            new("Manual", "Manual", 30, false),
        });
        yield return new LookupSeed("ContractTypes", new LookupRow[] {
            new("Supply", "Supply", 10, false),
            new("Service", "Service", 20, false),
            new("ProjectSupplied", "Project Supplied", 30, false),
        });
        yield return new LookupSeed("CommentTypes", new LookupRow[] {
            new("Note", "Note", 10, false),
            new("Query", "Query", 20, false),
            new("Response", "Response", 30, false),
        });
        yield return new LookupSeed("NotificationTypes", new LookupRow[] {
            new("ActionRequired", "Action Required", 10, false),
            new("HighQuoteAlert", "High Quote Alert", 20, false),
            new("Escalation", "Escalation", 30, false),
            new("DuplicateItemBlocked", "Duplicate Item Blocked", 40, false),
            new("VendorDecision", "Vendor Decision", 50, false),
            new("PoTermsChanged", "Po Terms Changed", 60, false),
            new("PaymentConfirmed", "Payment Confirmed", 70, false),
            new("AuditQuery", "Audit Query", 80, false),
        });
        yield return new LookupSeed("ClauseCategories", new LookupRow[] {
            new("Scope", "Scope", 10, false),
            new("Delivery", "Delivery", 20, false),
            new("ImportAndCustoms", "Import And Customs", 30, false),
            new("Payment", "Payment", 40, false),
            new("Advance", "Advance", 50, false),
            new("Warranty", "Warranty", 60, false),
            new("Penalty", "Penalty", 70, false),
            new("SecurityDeposit", "Security Deposit", 80, false),
            new("GoverningLaw", "Governing Law", 90, false),
            new("DisputeResolution", "Dispute Resolution", 100, false),
            new("Termination", "Termination", 110, false),
            new("Confidentiality", "Confidentiality", 120, false),
        });
        yield return new LookupSeed("AmendmentTypes", new LookupRow[] {
            new("Price", "Price", 10, false),
            new("Quantity", "Quantity", 20, false),
            new("DeliveryDate", "Delivery Date", 30, false),
            new("PaymentTerms", "Payment Terms", 40, false),
            new("OtherTerms", "Other Terms", 50, false),
        });
        yield return new LookupSeed("SecurityDepositStatuses", new LookupRow[] {
            new("Held", "Held", 10, false),
            new("Returned", "Returned", 20, true),
            new("Encashed", "Encashed", 30, true),
        });
        yield return new LookupSeed("AdvanceTypes", new LookupRow[] {
            new("None", "None", 10, false),
            new("Percent", "Percent", 20, false),
            new("Amount", "Amount", 30, false),
        });
        yield return new LookupSeed("AiCheckTypes", new LookupRow[] {
            new("DuplicateItemLocation", "Duplicate Item Location", 10, false),
            new("SplitPurchase", "Split Purchase", 20, false),
            new("MarketPrice", "Market Price", 30, false),
            new("HighQuote", "High Quote", 40, false),
        });
        yield return new LookupSeed("MonthEndAuditStatuses", new LookupRow[] {
            new("Open", "Open", 10, false),
            new("InReview", "In Review", 20, false),
            new("Completed", "Completed", 30, true),
        });
        yield return new LookupSeed("EntityTypes", new LookupRow[] {
            new("PurchaseRequisition", "Purchase Requisition", 10, false),
            new("PrLine", "Pr Line", 20, false),
            new("PurchaseOrder", "Purchase Order", 30, false),
            new("GoodsReceipt", "Goods Receipt", 40, false),
            new("SupplierInvoice", "Supplier Invoice", 50, false),
            new("Contract", "Contract", 60, false),
            new("Quotation", "Quotation", 70, false),
            new("Vendor", "Vendor", 80, false),
            new("VendorRegistrationRequest", "Vendor Registration Request", 90, false),
            new("RecurringPlan", "Recurring Plan", 100, false),
            new("ItemRequest", "Item Request", 110, false),
            new("PolicyVersion", "Policy Version", 120, false),
            new("User", "User", 130, false),
        });
        yield return new LookupSeed("Currencies", new LookupRow[] {
            new("PKR", "Pakistani Rupee", 10, false),
            new("USD", "US Dollar", 20, false),
            new("AED", "UAE Dirham", 30, false),
        });
    }
}
