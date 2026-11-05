namespace Procurement.Domain.Constants;

public static class PrStatusCodes
{
    public const string Draft = "Draft";
    public const string AwaitingBill = "AwaitingBill";
    public const string PendingHod = "PendingHod";
    public const string PendingFinance = "PendingFinance";
    public const string PendingAudit = "PendingAudit";
    public const string PendingOpd = "PendingOpd";
    public const string PendingProcurement = "PendingProcurement";
    public const string PendingQuotations = "PendingQuotations";
    public const string PendingQuoteReview = "PendingQuoteReview";
    public const string PoPreparation = "PoPreparation";
    public const string PoIssued = "PoIssued";
    public const string PartiallyReceived = "PartiallyReceived";
    public const string AwaitingAcknowledgement = "AwaitingAcknowledgement";
    public const string BillPending = "BillPending";
    public const string WithFinancePortal = "WithFinancePortal";
    public const string AuditReview = "AuditReview";
    public const string Queried = "Queried";
    public const string Returned = "Returned";
    public const string OnHold = "OnHold";
    public const string Closed = "Closed";
    public const string Rejected = "Rejected";
    public const string Cancelled = "Cancelled";
}

public static class CostTypeCodes
{
    public const string Final = "Final";
    public const string Tentative = "Tentative";
}

public static class ProcurementModeCodes
{
    public const string Bill = "Bill";
    public const string PolicyClaim = "PolicyClaim";
    public const string RecurringBill = "RecurringBill";
    public const string RecurringItems = "RecurringItems";
    public const string Sourcing = "Sourcing";
}

public static class PoTypeCodes
{
    public const string Standard = "Standard";
    public const string Manual = "Manual";
    public const string Recurring = "Recurring";
}

public static class PoStatusCodes
{
    public const string Draft = "Draft";
    public const string Issued = "Issued";
    public const string AwaitingContract = "AwaitingContract";
    public const string Active = "Active";
    public const string PartiallyReceived = "PartiallyReceived";
    public const string Received = "Received";
    public const string ShortClosed = "ShortClosed";
    public const string Cancelled = "Cancelled";
    public const string Closed = "Closed";
}

public static class VendorStatusCodes
{
    public const string Approved = "Approved";
    public const string Suspended = "Suspended";
    public const string Blacklisted = "Blacklisted";
    public const string Inactive = "Inactive";
}

public static class ApprovalRequestStatusCodes
{
    public const string Draft = "Draft";
    public const string PendingProcurement = "PendingProcurement";
    public const string PendingProcurementHod = "PendingProcurementHod";
    public const string PendingFinance = "PendingFinance";
    public const string PendingAudit = "PendingAudit";
    public const string PendingOpd = "PendingOpd";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Returned = "Returned";
    public const string Cancelled = "Cancelled";
}

public static class TaskStatusCodes
{
    public const string Open = "Open";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
    public const string Escalated = "Escalated";
}

public static class ActionTypeCodes
{
    public const string Submit = "Submit";
    public const string Approve = "Approve";
    public const string Reject = "Reject";
    public const string Return = "Return";
    public const string Query = "Query";
    public const string Respond = "Respond";
    public const string Complete = "Complete";
    public const string Skip = "Skip";
    public const string Hold = "Hold";
    public const string Release = "Release";
    public const string Override = "Override";
    public const string ForceRevert = "ForceRevert";
    public const string Void = "Void";
    public const string Cancel = "Cancel";
    public const string Close = "Close";
}

public static class StageTypeCodes
{
    public const string Approval = "Approval";
    public const string Operational = "Operational";
    public const string Review = "Review";
    public const string Exception = "Exception";
    public const string Closure = "Closure";
}

public static class DocumentTypeCodes
{
    public const string Bill = "Bill";
    public const string SupportingDoc = "SupportingDoc";
    public const string Quotation = "Quotation";
    public const string Contract = "Contract";
    public const string SignedContract = "SignedContract";
    public const string SecurityCheque = "SecurityCheque";
    public const string Invoice = "Invoice";
    public const string PaymentProof = "PaymentProof";
    public const string GrnNote = "GrnNote";
    public const string VendorNtn = "VendorNtn";
    public const string VendorBankLetter = "VendorBankLetter";
    public const string Other = "Other";
    public const string DeliveryNote = "DeliveryNote";
    public const string ContractAnnex = "ContractAnnex";
}

public static class RecurringFrequencyCodes
{
    public const string Monthly = "Monthly";
    public const string Quarterly = "Quarterly";
    public const string HalfYearly = "HalfYearly";
    public const string Yearly = "Yearly";
}

public static class RecurringPlanTypeCodes
{
    public const string Bill = "Bill";
    public const string Items = "Items";
}

public static class OccurrenceStatusCodes
{
    public const string Scheduled = "Scheduled";
    public const string Generated = "Generated";
    public const string Skipped = "Skipped";
    public const string Failed = "Failed";
}

public static class QueryStatusCodes
{
    public const string Open = "Open";
    public const string Responded = "Responded";
    public const string Closed = "Closed";
}

public static class DispatchChannelCodes
{
    public const string Email = "Email";
    public const string WhatsApp = "WhatsApp";
    public const string Manual = "Manual";
}

public static class ContractTypeCodes
{
    public const string Supply = "Supply";
    public const string Service = "Service";
    public const string ProjectSupplied = "ProjectSupplied";
}

public static class CommentTypeCodes
{
    public const string Note = "Note";
    public const string Query = "Query";
    public const string Response = "Response";
}

public static class CurrencyCodes
{
    public const string Pkr = "PKR";
    public const string Usd = "USD";
    public const string Aed = "AED";
}

public static class NotificationTypeCodes
{
    public const string ActionRequired = "ActionRequired";
    public const string HighQuoteAlert = "HighQuoteAlert";
    public const string Escalation = "Escalation";
    public const string DuplicateItemBlocked = "DuplicateItemBlocked";
    public const string VendorDecision = "VendorDecision";
    public const string PoTermsChanged = "PoTermsChanged";
    public const string PaymentConfirmed = "PaymentConfirmed";
    public const string AuditQuery = "AuditQuery";
}

public static class ClauseCategoryCodes
{
    public const string Scope = "Scope";
    public const string Delivery = "Delivery";
    public const string ImportCustoms = "ImportCustoms";
    public const string Payment = "Payment";
    public const string Advance = "Advance";
    public const string Warranty = "Warranty";
    public const string Penalty = "Penalty";
    public const string SecurityDeposit = "SecurityDeposit";
    public const string GoverningLaw = "GoverningLaw";
    public const string DisputeResolution = "DisputeResolution";
    public const string Termination = "Termination";
    public const string Confidentiality = "Confidentiality";
}

public static class AmendmentTypeCodes
{
    public const string Price = "Price";
    public const string Quantity = "Quantity";
    public const string DeliveryDate = "DeliveryDate";
    public const string PaymentTerms = "PaymentTerms";
    public const string OtherTerms = "OtherTerms";
}

public static class SecurityDepositStatusCodes
{
    public const string Held = "Held";
    public const string Returned = "Returned";
    public const string Encashed = "Encashed";
}

public static class AdvanceTypeCodes
{
    public const string None = "None";
    public const string Percent = "Percent";
    public const string Amount = "Amount";
}

public static class AiCheckTypeCodes
{
    public const string DuplicateItemLocation = "DuplicateItemLocation";
    public const string SplitPurchase = "SplitPurchase";
    public const string MarketPrice = "MarketPrice";
    public const string HighQuote = "HighQuote";
}

public static class MonthEndAuditStatusCodes
{
    public const string Open = "Open";
    public const string InReview = "InReview";
    public const string Completed = "Completed";
}

public static class EntityTypeCodes
{
    public const string PurchaseRequisition = "PurchaseRequisition";
    public const string PrLine = "PrLine";
    public const string PurchaseOrder = "PurchaseOrder";
    public const string GoodsReceipt = "GoodsReceipt";
    public const string SupplierInvoice = "SupplierInvoice";
    public const string Contract = "Contract";
    public const string Quotation = "Quotation";
    public const string Vendor = "Vendor";
    public const string VendorRegistrationRequest = "VendorRegistrationRequest";
    public const string RecurringPlan = "RecurringPlan";
    public const string ItemRequest = "ItemRequest";
    public const string PolicyVersion = "PolicyVersion";
    public const string User = "User";
}

public static class RoleCodes
{
    public const string Requestor = "REQUESTOR";
    public const string Hod = "HOD";
    public const string Procurement = "PROCUREMENT";
    public const string Finance = "FINANCE";
    public const string Audit = "AUDIT";
    public const string Opd = "OPD";
    public const string SysAdmin = "SYSADMIN";
    public const string System = "SYSTEM";
}

public static class SpendSubHeadCodes
{
    public const string PreCycFixed = "PRE-CYC-FIXED";
    public const string PreCycUsage = "PRE-CYC-USAGE";
    public const string PrePolicy = "PRE-POL";
    public const string AprFault = "APR-FAULT";
    public const string AprProject = "APR-PROJECT";
}

public static class WorkflowStageScopeTypes
{
    public const string None = "None";
    public const string Department = "Department";
    public const string Requester = "Requester";
    public const string FixedDepartment = "FixedDepartment";
}

public static class PolicySettingKeys
{
    public const string OpdQuoteExceptionThreshold = "OPD_QUOTE_EXCEPTION_THRESHOLD";
    public const string OverBudgetOpdThreshold = "OVER_BUDGET_OPD_THRESHOLD";
    public const string QuoteThreshold = "QUOTE_THRESHOLD";
    public const string StarVendorMinScore = "STAR_VENDOR_MIN_SCORE";
    public const string VendorWeightOnTime = "VENDOR_WEIGHT_ONTIME";
    public const string VendorWeightPrice = "VENDOR_WEIGHT_PRICE";
    public const string VendorWeightQuality = "VENDOR_WEIGHT_QUALITY";
    public const string DuplicateItemLocationBlock = "DUPLICATE_ITEM_LOCATION_BLOCK";
    public const string HighQuoteAlert = "HIGH_QUOTE_ALERT";
    public const string BudgetCheckAllPrs = "BUDGET_CHECK_ALL_PRS";
    public const string DefaultEscalationDays = "DEFAULT_ESCALATION_DAYS";
    public const string TentativeMinorPct = "TENTATIVE_MINOR_PCT";
    public const string TentativeMajorPct = "TENTATIVE_MAJOR_PCT";
    public const string SplitWindowDays = "SPLIT_WINDOW_DAYS";
    public const string SurveyStaleDays = "SURVEY_STALE_DAYS";
    public const string OnUsageHistoryDays = "ONUSAGE_HISTORY_DAYS";
    public const string EmergencyWatchHours = "EMERGENCY_WATCH_HOURS";
}

public static class WorkflowDefinitionCodes
{
    public const string Bill = "WF_BILL";
    public const string CyclicBill = "WF_CYCLIC_BILL";
    public const string CyclicItems = "WF_CYCLIC_ITEMS";
    public const string Sourcing = "WF_SOURCING";
    public const string VendorRegistration = "WF_VENDOR_REGISTRATION";
}
