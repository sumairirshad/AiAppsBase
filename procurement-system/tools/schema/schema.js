// Master schema spec for the Procurement System.
// Consumed by generate.js to emit C# Domain entities + EF Core configurations + seed data.
// Column shape: { name, type, pk, fk: "Table.Col", nullable, unique, default, note, computed }

function col(name, type, opts = {}) { return { name, type, ...opts }; }
function pk(name = "Id", type = "BIGINT IDENTITY") { return col(name, type, { pk: true }); }
function fk(name, type, ref, opts = {}) { return col(name, type, { fk: ref, ...opts }); }
function audit() {
  return [
    fk("CreatedAt", "DATETIME2(0)", null, { default: "SYSUTCDATETIME()" }),
    fk("CreatedBy", "BIGINT", "Users.Id"),
    col("UpdatedAt", "DATETIME2(0)", { nullable: true }),
    fk("UpdatedBy", "BIGINT", "Users.Id", { nullable: true }),
  ];
}
function lookupCols(extra = []) {
  return [
    pk("Id", "SMALLINT IDENTITY"),
    col("Code", "VARCHAR(40)", { unique: true }),
    col("Name", "NVARCHAR(100)"),
    col("SortOrder", "SMALLINT", { default: "0" }),
    col("IsActive", "BIT", { default: "1" }),
    ...extra,
  ];
}
function lookupTerminalCols(extra = []) {
  return lookupCols([col("IsTerminal", "BIT", { default: "0", note: "No further transitions" }), ...extra]);
}

function lookup(name, module, seeds, opts = {}) {
  return { name, module, kind: "lookup", columns: lookupCols(opts.extra), seeds };
}
function lookupTerminal(name, module, seeds, opts = {}) {
  return { name, module, kind: "lookup", columns: lookupTerminalCols(opts.extra), seeds };
}

// ---------------------------------------------------------------------------
// LOOKUPS (27)
// ---------------------------------------------------------------------------
const lookups = [
  lookupTerminal("PrStatuses", "Lookups", [
    "Draft", "AwaitingBill", "PendingHod", "PendingFinance", "PendingAudit", "PendingOpd",
    "PendingProcurement", "PendingQuotations", "PendingQuoteReview", "PoPreparation", "PoIssued",
    "PartiallyReceived", "AwaitingAcknowledgement", "BillPending", "WithFinancePortal", "AuditReview",
    "Queried", "Returned", "OnHold", { code: "Closed", terminal: true }, { code: "Rejected", terminal: true },
    { code: "Cancelled", terminal: true },
  ]),
  lookup("CostTypes", "Lookups", ["Final", "Tentative"]),
  lookup("ProcurementModes", "Lookups", ["Bill", "PolicyClaim", "RecurringBill", "RecurringItems", "Sourcing"]),
  lookup("PoTypes", "Lookups", ["Standard", "Manual", "Recurring"]),
  lookupTerminal("PoStatuses", "Lookups", [
    "Draft", "Issued", "AwaitingContract", "Active", "PartiallyReceived", "Received",
    { code: "ShortClosed", terminal: true }, { code: "Cancelled", terminal: true }, { code: "Closed", terminal: true },
  ]),
  lookupTerminal("VendorStatuses", "Lookups", ["Approved", "Suspended", { code: "Blacklisted", terminal: true }, "Inactive"]),
  lookupTerminal("ApprovalRequestStatuses", "Lookups", [
    "Draft", "PendingProcurement", "PendingProcurementHod", "PendingFinance", "PendingAudit", "PendingOpd",
    { code: "Approved", terminal: true }, { code: "Rejected", terminal: true }, "Returned", { code: "Cancelled", terminal: true },
  ]),
  lookupTerminal("TaskStatuses", "Lookups", ["Open", { code: "Completed", terminal: true }, { code: "Cancelled", terminal: true }, "Escalated"]),
  lookup("ActionTypes", "Lookups", [
    "Submit", "Approve", "Reject", "Return", "Query", "Respond", "Refer", "Complete", "Skip",
    "Hold", "Release", "Override", "ForceRevert", "Void", "Cancel", "Close",
  ]),
  lookup("StageTypes", "Lookups", ["Approval", "Operational", "Review", "Exception", "Closure"]),
  lookup("DocumentTypes", "Lookups", [
    "Bill", "SupportingDoc", "Quotation", "Contract", "SignedContract", "SecurityCheque", "Invoice",
    "PaymentProof", "GrnNote", "VendorNtn", "VendorBankLetter", "Other", "DeliveryNote", "ContractAnnex",
  ]),
  lookup("RecurringFrequencies", "Lookups", ["Monthly", "Quarterly", "HalfYearly", "Yearly"]),
  lookup("RecurringPlanTypes", "Lookups", ["Bill", "Items"]),
  lookup("OccurrenceStatuses", "Lookups", ["Scheduled", "Generated", "Skipped", "Failed"]),
  lookupTerminal("QueryStatuses", "Lookups", ["Open", "Responded", { code: "Closed", terminal: true }]),
  lookup("DispatchChannels", "Lookups", ["Email", "WhatsApp", "Manual"]),
  lookup("ContractTypes", "Lookups", ["Supply", "Service", "ProjectSupplied"]),
  lookup("CommentTypes", "Lookups", ["Note", "Query", "Response"]),
  {
    name: "Currencies", module: "Lookups", kind: "lookup",
    columns: [col("Code", "CHAR(3)", { pk: true }), col("Name", "NVARCHAR(50)"), col("IsActive", "BIT", { default: "1" })],
    seeds: [{ code: "PKR", name: "Pakistani Rupee" }, { code: "USD", name: "US Dollar" }, { code: "AED", name: "UAE Dirham" }],
    pkIsCode: true,
  },
  lookup("NotificationTypes", "Lookups", [
    "ActionRequired", "HighQuoteAlert", "Escalation", "DuplicateItemBlocked", "VendorDecision",
    "PoTermsChanged", "PaymentConfirmed", "AuditQuery",
  ]),
  lookup("ClauseCategories", "Lookups", [
    "Scope", "Delivery", "ImportAndCustoms", "Payment", "Advance", "Warranty", "Penalty",
    "SecurityDeposit", "GoverningLaw", "DisputeResolution", "Termination", "Confidentiality",
  ]),
  lookup("AmendmentTypes", "Lookups", ["Price", "Quantity", "DeliveryDate", "PaymentTerms", "OtherTerms"]),
  lookupTerminal("SecurityDepositStatuses", "Lookups", ["Held", { code: "Returned", terminal: true }, { code: "Encashed", terminal: true }]),
  lookup("AdvanceTypes", "Lookups", ["None", "Percent", "Amount"]),
  lookup("AiCheckTypes", "Lookups", ["DuplicateItemLocation", "SplitPurchase", "MarketPrice", "HighQuote"]),
  lookupTerminal("MonthEndAuditStatuses", "Lookups", ["Open", "InReview", { code: "Completed", terminal: true }]),
  lookup("EntityTypes", "Lookups", [
    "PurchaseRequisition", "PrLine", "PurchaseOrder", "GoodsReceipt", "SupplierInvoice", "Contract",
    "Quotation", "Vendor", "VendorRegistrationRequest", "RecurringPlan", "ItemRequest", "PolicyVersion", "User",
  ], { extra: [col("TableName", "VARCHAR(60)", { nullable: true, note: "Table EntityId points into" })] }),
];

// ---------------------------------------------------------------------------
// ENTITY TABLES (61), grouped by module
// ---------------------------------------------------------------------------
const entities = [
  // ---- Identity & Org ----
  { name: "Departments", module: "Identity & Org", columns: [
    pk(), col("Code", "VARCHAR(20)", { unique: true }), col("Name", "NVARCHAR(100)"),
    fk("ParentId", "BIGINT", "Departments.Id", { nullable: true }),
    fk("HodUserId", "BIGINT", "Users.Id", { nullable: true }),
    col("IsActive", "BIT", { default: "1" }), ...audit(),
  ]},
  { name: "Locations", module: "Identity & Org", columns: [
    pk(), col("Code", "VARCHAR(20)", { unique: true }), col("Name", "NVARCHAR(100)"),
    col("Address", "NVARCHAR(300)", { nullable: true }),
    col("IsActive", "BIT", { default: "1", note: "Created and maintained by OPD only" }), ...audit(),
  ]},
  { name: "Users", module: "Identity & Org", columns: [
    pk(), col("EmployeeNo", "VARCHAR(20)", { unique: true }), col("DisplayName", "NVARCHAR(150)"),
    col("Email", "VARCHAR(150)", { unique: true }),
    fk("DepartmentId", "BIGINT", "Departments.Id", { note: "Mandatory: every user belongs to a department" }),
    col("PasswordHash", "VARCHAR(256)", { nullable: true, note: "Null if SSO" }),
    col("IsActive", "BIT", { default: "1" }), ...audit(),
  ]},
  { name: "Roles", module: "Identity & Org", columns: [
    pk(), col("Code", "VARCHAR(30)", { unique: true }), col("Name", "NVARCHAR(60)"),
  ], seeds: ["REQUESTOR", "HOD", "PROCUREMENT", "FINANCE", "AUDIT", "OPD", "SYSADMIN", "SYSTEM"] },
  { name: "Permissions", module: "Identity & Org", columns: [
    pk(), col("Code", "VARCHAR(60)", { unique: true, note: "e.g. PR.APPROVE, VENDOR.VET, MATCH.OVERRIDE" }),
    col("Description", "NVARCHAR(200)"),
  ]},
  { name: "RolePermissions", module: "Identity & Org", columns: [
    pk(), fk("RoleId", "BIGINT", "Roles.Id"), fk("PermissionId", "BIGINT", "Permissions.Id"),
  ]},
  { name: "UserRoleAssignments", module: "Identity & Org", columns: [
    pk(), fk("UserId", "BIGINT", "Users.Id"), fk("RoleId", "BIGINT", "Roles.Id"),
    fk("DepartmentId", "BIGINT", "Departments.Id", { nullable: true, note: "Scope; null = all" }),
    fk("LocationId", "BIGINT", "Locations.Id", { nullable: true }),
    col("ValidFrom", "DATE"), col("ValidTo", "DATE", { nullable: true }), ...audit(),
  ]},
  { name: "UserDepartmentAccess", module: "Identity & Org", columns: [
    pk(), fk("UserId", "BIGINT", "Users.Id"), fk("DepartmentId", "BIGINT", "Departments.Id"),
    col("CanRaisePr", "BIT", { default: "1" }), ...audit(),
  ]},

  // ---- Catalog & Projects ----
  { name: "SpendHeads", module: "Catalog & Projects", columns: [
    pk(), col("Code", "VARCHAR(20)", { unique: true }), col("Name", "NVARCHAR(100)"),
    col("ApprovalMode", "VARCHAR(20)", { note: "PreApproved / OnApproval" }),
  ]},
  { name: "SpendSubHeads", module: "Catalog & Projects", columns: [
    pk(), fk("SpendHeadId", "BIGINT", "SpendHeads.Id"), col("Code", "VARCHAR(20)", { unique: true }),
    col("Name", "NVARCHAR(100)"), fk("ProcurementModeId", "SMALLINT", "ProcurementModes.Id"),
    col("AllowsTentative", "BIT", { default: "0" }), fk("WorkflowDefinitionId", "BIGINT", "WorkflowDefinitions.Id"),
  ]},
  { name: "Units", module: "Catalog & Projects", columns: [
    pk(), col("Code", "VARCHAR(10)", { unique: true }), col("Name", "NVARCHAR(50)"), col("Precision", "TINYINT", { default: "0" }),
  ]},
  { name: "Categories", module: "Catalog & Projects", columns: [
    pk(), col("Code", "VARCHAR(30)", { unique: true }), col("Name", "NVARCHAR(100)"),
    fk("ParentId", "BIGINT", "Categories.Id", { nullable: true }), col("IsActive", "BIT", { default: "1" }), ...audit(),
  ]},
  { name: "Items", module: "Catalog & Projects", columns: [
    pk(), col("Code", "VARCHAR(30)", { unique: true }), col("Name", "NVARCHAR(150)"),
    fk("CategoryId", "BIGINT", "Categories.Id"), fk("UnitId", "BIGINT", "Units.Id"),
    col("IsActive", "BIT", { default: "1" }), ...audit(),
  ]},
  { name: "ItemRequests", module: "Catalog & Projects", columns: [
    pk(), col("RequestType", "VARCHAR(10)", { note: "Item / Category" }), col("ProposedName", "NVARCHAR(150)"),
    fk("CategoryId", "BIGINT", "Categories.Id", { nullable: true }), fk("RequestedBy", "BIGINT", "Users.Id"),
    fk("StatusId", "SMALLINT", "ApprovalRequestStatuses.Id"), fk("DecisionBy", "BIGINT", "Users.Id", { nullable: true }),
    col("DecisionReason", "NVARCHAR(500)", { nullable: true }), fk("CreatedItemId", "BIGINT", "Items.Id", { nullable: true }), ...audit(),
  ]},
  { name: "Projects", module: "Catalog & Projects", columns: [
    pk(), col("ProjectCode", "VARCHAR(20)", { unique: true }), col("Name", "NVARCHAR(150)"),
    fk("OwnerDepartmentId", "BIGINT", "Departments.Id"), fk("ManagerUserId", "BIGINT", "Users.Id", { nullable: true }),
    col("ContractProvided", "BIT", { default: "0", note: "If 1, PO only; no generated contract" }),
    col("IsActive", "BIT", { default: "1" }), ...audit(),
  ]},
  { name: "DepartmentCategories", module: "Catalog & Projects", columns: [
    pk(), fk("DepartmentId", "BIGINT", "Departments.Id"), fk("CategoryId", "BIGINT", "Categories.Id"),
  ]},
  { name: "MarketSurveys", module: "Catalog & Projects", columns: [
    pk(), fk("ItemId", "BIGINT", "Items.Id"), fk("LocationId", "BIGINT", "Locations.Id", { nullable: true, note: "null = all locations" }),
    col("SurveyedPrice", "DECIMAL(18,2)"), fk("CurrencyCode", "CHAR(3)", "Currencies.Code", { default: "'PKR'" }),
    col("Source", "NVARCHAR(150)"), col("SurveyedOn", "DATE"), fk("SurveyedBy", "BIGINT", "Users.Id"),
    col("IsStale", "BIT", { default: "0", note: "Set by worker when > SURVEY_STALE_DAYS" }), ...audit(),
  ]},

  // ---- Policy ----
  { name: "PolicyVersions", module: "Policy", columns: [
    pk(), col("VersionNo", "INT", { unique: true }), col("EffectiveFrom", "DATE"), col("EffectiveTo", "DATE", { nullable: true }),
    fk("StatusId", "SMALLINT", "ApprovalRequestStatuses.Id"), fk("ApprovedBy", "BIGINT", "Users.Id", { nullable: true }),
    col("ChangeReason", "NVARCHAR(500)", { note: "Mandatory when OPD changes a threshold" }), ...audit(),
  ]},
  { name: "ApprovalBands", module: "Policy", columns: [
    pk(), fk("PolicyVersionId", "BIGINT", "PolicyVersions.Id"), col("MinAmount", "DECIMAL(18,2)", { note: "Inclusive" }),
    col("MaxAmount", "DECIMAL(18,2)", { nullable: true, note: "Inclusive; null = no upper limit" }),
    col("Sequence", "INT"), fk("RoleId", "BIGINT", "Roles.Id"),
    fk("SpendSubHeadId", "BIGINT", "SpendSubHeads.Id", { nullable: true, note: "Null = all request types" }), ...audit(),
  ]},
  { name: "QuotationRules", module: "Policy", columns: [
    pk(), fk("PolicyVersionId", "BIGINT", "PolicyVersions.Id"), fk("SpendSubHeadId", "BIGINT", "SpendSubHeads.Id", { nullable: true }),
    col("MinAmount", "DECIMAL(18,2)", { nullable: true, note: "Inclusive" }),
    col("MaxAmount", "DECIMAL(18,2)", { nullable: true, note: "Exclusive" }),
    col("StarVendor", "BIT", { nullable: true, note: "null=any, 1=star, 0=not star (incl. new)" }),
    col("Emergency", "BIT", { nullable: true }), col("RequiredQuotes", "TINYINT", { note: "Distinct vendors" }),
    col("Priority", "INT", { note: "Lower wins" }), col("Description", "NVARCHAR(300)"), ...audit(),
  ]},
  { name: "PolicySettings", module: "Policy", columns: [
    pk(), fk("PolicyVersionId", "BIGINT", "PolicyVersions.Id"), col("SettingKey", "VARCHAR(60)"),
    col("ValueType", "VARCHAR(10)", { note: "Amount/Percent/Days/Hours/Bool" }), col("Value", "NVARCHAR(100)"),
    col("Description", "NVARCHAR(300)"), ...audit(),
  ]},

  // ---- Workflow Engine ----
  { name: "WorkflowDefinitions", module: "Workflow Engine", columns: [
    pk(), col("Code", "VARCHAR(40)"), col("Name", "NVARCHAR(100)"), fk("EntityTypeId", "SMALLINT", "EntityTypes.Id"),
    col("Version", "INT"), col("IsActive", "BIT", { default: "1" }), col("ActiveFrom", "DATE"),
    col("ActiveTo", "DATE", { nullable: true }), ...audit(),
  ]},
  { name: "WorkflowStages", module: "Workflow Engine", columns: [
    pk(), fk("DefinitionId", "BIGINT", "WorkflowDefinitions.Id"), col("StageCode", "VARCHAR(40)"), col("Sequence", "INT"),
    fk("StageTypeId", "SMALLINT", "StageTypes.Id"), fk("RoleId", "BIGINT", "Roles.Id", { nullable: true, note: "Null for system stages" }),
    fk("PrStatusId", "SMALLINT", "PrStatuses.Id", { nullable: true }),
    col("ConditionExpr", "VARCHAR(300)", { nullable: true, note: "e.g. IsHigherQuote && Amount>OPD_QUOTE_EXCEPTION" }),
    col("IsOptional", "BIT", { default: "0" }), col("EscalationDays", "INT", { nullable: true }),
    fk("EscalateToRoleId", "BIGINT", "Roles.Id", { nullable: true }),
    col("ScopeType", "VARCHAR(15)", { default: "'None'", note: "None/Department/Requester/FixedDepartment" }),
    fk("ScopeDepartmentId", "BIGINT", "Departments.Id", { nullable: true }), ...audit(),
  ]},
  { name: "WorkflowInstances", module: "Workflow Engine", columns: [
    pk(), fk("DefinitionId", "BIGINT", "WorkflowDefinitions.Id"), fk("EntityTypeId", "SMALLINT", "EntityTypes.Id"),
    col("EntityId", "BIGINT"), fk("CurrentStageId", "BIGINT", "WorkflowStages.Id", { nullable: true }),
    col("Status", "VARCHAR(20)", { note: "Running/Completed/Cancelled" }), fk("PolicyVersionId", "BIGINT", "PolicyVersions.Id"),
    col("StartedAt", "DATETIME2(0)"), col("CompletedAt", "DATETIME2(0)", { nullable: true }),
    col("RowVer", "ROWVERSION", { note: "Optimistic concurrency; 409 on conflict" }), ...audit(),
  ]},
  { name: "WorkflowTasks", module: "Workflow Engine", columns: [
    pk(), fk("InstanceId", "BIGINT", "WorkflowInstances.Id"), fk("StageId", "BIGINT", "WorkflowStages.Id"),
    fk("AssignedRoleId", "BIGINT", "Roles.Id"), fk("AssignedUserId", "BIGINT", "Users.Id", { nullable: true }),
    fk("ScopeDepartmentId", "BIGINT", "Departments.Id", { nullable: true }), fk("TaskStatusId", "SMALLINT", "TaskStatuses.Id"),
    col("DueAt", "DATETIME2(0)", { nullable: true }), col("CompletedAt", "DATETIME2(0)", { nullable: true }),
    col("EscalatedAt", "DATETIME2(0)", { nullable: true }), fk("EscalatedToRoleId", "BIGINT", "Roles.Id", { nullable: true }), ...audit(),
  ]},
  { name: "WorkflowActions", module: "Workflow Engine", columns: [
    pk(), fk("InstanceId", "BIGINT", "WorkflowInstances.Id"), fk("TaskId", "BIGINT", "WorkflowTasks.Id", { nullable: true }),
    fk("ActionTypeId", "SMALLINT", "ActionTypes.Id"), fk("ActorUserId", "BIGINT", "Users.Id"), fk("ActorRoleId", "BIGINT", "Roles.Id"),
    fk("FromStageId", "BIGINT", "WorkflowStages.Id", { nullable: true }), fk("ToStageId", "BIGINT", "WorkflowStages.Id", { nullable: true }),
    col("Remarks", "NVARCHAR(1000)", { nullable: true, note: "Required for Reject/Return/Override/ForceRevert/Void" }),
    fk("PolicyVersionId", "BIGINT", "PolicyVersions.Id"), col("CorrelationId", "UNIQUEIDENTIFIER"), col("ActedAt", "DATETIME2(0)"),
  ], appendOnly: true },

  // ---- Documents ----
  { name: "Documents", module: "Documents", columns: [
    pk(), col("StorageKey", "VARCHAR(300)", { unique: true }), col("FileName", "NVARCHAR(260)"), col("ContentType", "VARCHAR(100)"),
    col("SizeBytes", "BIGINT"), col("Sha256", "CHAR(64)"), fk("DocumentTypeId", "SMALLINT", "DocumentTypes.Id"),
    col("Classification", "VARCHAR(20)", { default: "'Internal'" }), col("VersionNo", "INT", { default: "1" }),
    fk("ReplacesDocumentId", "BIGINT", "Documents.Id", { nullable: true }), ...audit(),
  ]},
  { name: "DocumentLinks", module: "Documents", columns: [
    pk(), fk("DocumentId", "BIGINT", "Documents.Id"), fk("EntityTypeId", "SMALLINT", "EntityTypes.Id"), col("EntityId", "BIGINT"), ...audit(),
  ]},

  // ---- Vendors ----
  { name: "Vendors", module: "Vendors", columns: [
    pk(), col("VendorCode", "VARCHAR(20)", { unique: true }), col("LegalName", "NVARCHAR(200)"), col("Ntn", "VARCHAR(20)", { unique: true }),
    col("Strn", "VARCHAR(20)", { nullable: true }), fk("VendorStatusId", "SMALLINT", "VendorStatuses.Id"),
    col("HasDeliveryHistory", "BIT", { default: "0" }), col("BlacklistReason", "NVARCHAR(500)", { nullable: true }),
    col("RowVer", "ROWVERSION"), col("OnTimeScore", "DECIMAL(5,2)", { nullable: true }), col("PriceScore", "DECIMAL(5,2)", { nullable: true }),
    col("QualityScore", "DECIMAL(5,2)", { nullable: true }), col("OverallScore", "DECIMAL(5,2)", { nullable: true }),
    col("IsStarVendor", "BIT", { default: "0" }), col("ScoreUpdatedAt", "DATETIME2(0)", { nullable: true }), ...audit(),
  ]},
  { name: "VendorCategories", module: "Vendors", columns: [
    pk(), fk("VendorId", "BIGINT", "Vendors.Id"), fk("CategoryId", "BIGINT", "Categories.Id"),
  ]},
  { name: "VendorContacts", module: "Vendors", columns: [
    pk(), fk("VendorId", "BIGINT", "Vendors.Id"), col("Name", "NVARCHAR(150)"), col("Email", "VARCHAR(150)", { nullable: true }),
    col("Phone", "VARCHAR(30)", { nullable: true }), col("IsPrimary", "BIT", { default: "0" }), ...audit(),
  ]},
  { name: "VendorBankAccounts", module: "Vendors", columns: [
    pk(), fk("VendorId", "BIGINT", "Vendors.Id"), col("BankName", "NVARCHAR(150)"), col("AccountTitle", "NVARCHAR(200)"),
    col("AccountNoEncrypted", "VARBINARY(256)"), col("AccountNoMasked", "VARCHAR(40)"), col("TitleMatchesLegalName", "BIT"),
    fk("ExceptionApprovedBy", "BIGINT", "Users.Id", { nullable: true, note: "Required when mismatch" }),
    col("IsActive", "BIT", { default: "1" }), ...audit(),
  ]},
  { name: "VendorDocuments", module: "Vendors", columns: [
    pk(), fk("VendorId", "BIGINT", "Vendors.Id"), fk("DocumentId", "BIGINT", "Documents.Id"),
    col("ExpiryDate", "DATE", { nullable: true }), ...audit(),
  ]},
  { name: "VendorRegistrationRequests", module: "Vendors", columns: [
    pk(), col("RequestNo", "VARCHAR(20)", { unique: true }), col("ProposedData", "NVARCHAR(MAX)", { note: "JSON snapshot" }),
    fk("ProposedByUserId", "BIGINT", "Users.Id"), fk("SourceRoleId", "BIGINT", "Roles.Id"),
    fk("StatusId", "SMALLINT", "ApprovalRequestStatuses.Id"), fk("ProcurementDecisionBy", "BIGINT", "Users.Id", { nullable: true }),
    col("ProcurementReason", "NVARCHAR(500)", { nullable: true }), fk("CreatedVendorId", "BIGINT", "Vendors.Id", { nullable: true }),
    fk("ProcurementHodDecisionBy", "BIGINT", "Users.Id", { nullable: true }), col("ProcurementHodReason", "NVARCHAR(500)", { nullable: true }),
    col("RequesterNotifiedAt", "DATETIME2(0)", { nullable: true }), ...audit(),
  ]},

  // ---- Purchase Requisition ----
  { name: "PurchaseRequisitions", module: "Purchase Requisition", columns: [
    pk(), col("PrNumber", "VARCHAR(20)", { unique: true, note: "PR-YYYY-NNNNN via SEQUENCE" }),
    fk("RequesterId", "BIGINT", "Users.Id"), fk("DepartmentId", "BIGINT", "Departments.Id"),
    fk("LocationId", "BIGINT", "Locations.Id"), fk("SpendSubHeadId", "BIGINT", "SpendSubHeads.Id"),
    fk("ProjectId", "BIGINT", "Projects.Id", { nullable: true }), fk("CostTypeId", "SMALLINT", "CostTypes.Id"),
    col("IsEmergency", "BIT", { default: "0" }), col("EmergencyJustification", "NVARCHAR(500)", { nullable: true }),
    col("Title", "NVARCHAR(200)"), col("EstimatedAmount", "DECIMAL(18,2)"), col("ApprovedAmount", "DECIMAL(18,2)", { nullable: true }),
    col("FinalAmount", "DECIMAL(18,2)", { nullable: true }), fk("CurrencyCode", "CHAR(3)", "Currencies.Code", { default: "'PKR'" }),
    col("RequiredQuotes", "TINYINT", { nullable: true }), fk("PrStatusId", "SMALLINT", "PrStatuses.Id"),
    fk("WorkflowInstanceId", "BIGINT", "WorkflowInstances.Id", { nullable: true }),
    fk("PolicyVersionId", "BIGINT", "PolicyVersions.Id", { nullable: true }),
    fk("RecurringOccurrenceId", "BIGINT", "RecurringOccurrences.Id", { nullable: true }),
    col("SubmittedAt", "DATETIME2(0)", { nullable: true }), col("ClosedAt", "DATETIME2(0)", { nullable: true }),
    col("RowVer", "ROWVERSION"), col("RaisedOnBehalf", "BIT", { default: "0", note: "1 when OPD raised it" }),
    col("TentativeVariancePct", "DECIMAL(7,2)", { nullable: true }), ...audit(),
  ]},
  { name: "PrLines", module: "Purchase Requisition", columns: [
    pk(), fk("PrId", "BIGINT", "PurchaseRequisitions.Id"), col("LineNo", "INT"), fk("ItemId", "BIGINT", "Items.Id"),
    col("Description", "NVARCHAR(300)", { nullable: true }), col("Qty", "DECIMAL(18,3)"), fk("UnitId", "BIGINT", "Units.Id"),
    col("EstUnitPrice", "DECIMAL(18,2)"), col("LineTotal", "DECIMAL(18,2)", { computed: "Qty * EstUnitPrice" }),
    fk("SuggestedVendorId", "BIGINT", "Vendors.Id", { nullable: true }), fk("SourcingGroupId", "BIGINT", "SourcingGroups.Id", { nullable: true }),
    fk("LocationId", "BIGINT", "Locations.Id", { note: "Part of unique open-PR-per-item+location index" }),
    col("AcceptedQty", "DECIMAL(18,3)", { default: "0" }), fk("AwardedVendorId", "BIGINT", "Vendors.Id", { nullable: true }),
    fk("AwardedQuotationLineId", "BIGINT", "QuotationLines.Id", { nullable: true }),
    col("OverrideReason", "NVARCHAR(500)", { nullable: true, note: "Required when Procurement changes suggested vendor" }),
    col("MarketPriceAtRequest", "DECIMAL(18,2)", { nullable: true }), col("LastPaidPriceAtRequest", "DECIMAL(18,2)", { nullable: true }),
    col("PriceWarningPct", "DECIMAL(7,2)", { nullable: true }), ...audit(),
  ]},
  { name: "PrBills", module: "Purchase Requisition", columns: [
    pk(), fk("PrId", "BIGINT", "PurchaseRequisitions.Id", { unique: true, note: "1:0..1" }),
    col("BillingPeriod", "VARCHAR(30)"), col("BillAmount", "DECIMAL(18,2)"), col("Purpose", "NVARCHAR(300)"),
    col("DueDate", "DATE"), fk("BillDocumentId", "BIGINT", "Documents.Id"),
    fk("PayeeVendorId", "BIGINT", "Vendors.Id", { nullable: true, note: "Who the bill is payable to; reuses SupplierInvoices/Finance-Portal tracking" }),
    ...audit(),
  ]},
  { name: "PrComments", module: "Purchase Requisition", columns: [
    pk(), fk("PrId", "BIGINT", "PurchaseRequisitions.Id"), fk("CommentTypeId", "SMALLINT", "CommentTypes.Id"),
    fk("AuthorUserId", "BIGINT", "Users.Id"), col("Body", "NVARCHAR(2000)"),
    fk("ParentCommentId", "BIGINT", "PrComments.Id", { nullable: true }), ...audit(),
  ]},

  // ---- Sourcing ----
  { name: "Quotations", module: "Sourcing", columns: [
    pk(), fk("PrId", "BIGINT", "PurchaseRequisitions.Id"), fk("VendorId", "BIGINT", "Vendors.Id"),
    col("QuotationNo", "VARCHAR(40)"), col("QuotationDate", "DATE"), fk("CurrencyCode", "CHAR(3)", "Currencies.Code"),
    col("Total", "DECIMAL(18,2)"), col("ValidUntil", "DATE", { nullable: true }), fk("DocumentId", "BIGINT", "Documents.Id"),
    fk("SourcingGroupId", "BIGINT", "SourcingGroups.Id"), col("TaxTotal", "DECIMAL(18,2)", { default: "0" }),
    col("ComparableTotal", "DECIMAL(18,2)", { note: "Total excl. tax, in PKR - used for lowest/recommended" }), ...audit(),
  ]},
  { name: "QuotationLines", module: "Sourcing", columns: [
    pk(), fk("QuotationId", "BIGINT", "Quotations.Id"), fk("PrLineId", "BIGINT", "PrLines.Id"),
    col("Qty", "DECIMAL(18,3)"), col("UnitPrice", "DECIMAL(18,2)"), col("Tax", "DECIMAL(18,2)", { default: "0" }),
    col("Discount", "DECIMAL(18,2)", { default: "0" }), col("DeliveryDays", "INT", { nullable: true }),
  ]},
  { name: "SourcingGroups", module: "Sourcing", columns: [
    pk(), fk("PrId", "BIGINT", "PurchaseRequisitions.Id"), col("GroupNo", "INT"), fk("CategoryId", "BIGINT", "Categories.Id", { nullable: true }),
    col("GroupAmount", "DECIMAL(18,2)"), col("RequiredQuotes", "TINYINT"), fk("QuotationRuleId", "BIGINT", "QuotationRules.Id"),
    fk("RecommendedQuotationId", "BIGINT", "Quotations.Id", { nullable: true, note: "Lowest" }),
    fk("SelectedQuotationId", "BIGINT", "Quotations.Id", { nullable: true }),
    col("SelectionJustification", "NVARCHAR(500)", { nullable: true, note: "Required if not lowest" }),
    fk("SelectedBy", "BIGINT", "Users.Id", { nullable: true, note: "Audit" }),
    fk("OpdDecisionBy", "BIGINT", "Users.Id", { nullable: true, note: "Higher quote on PR > OPD_QUOTE_EXCEPTION_THRESHOLD" }), ...audit(),
  ]},
  { name: "AiChecks", module: "Sourcing", columns: [
    pk(), fk("CheckTypeId", "SMALLINT", "AiCheckTypes.Id"), fk("EntityTypeId", "SMALLINT", "EntityTypes.Id"), col("EntityId", "BIGINT"),
    col("Outcome", "VARCHAR(20)", { note: "Pass/Warn/Block" }), col("ResultJson", "NVARCHAR(MAX)", { nullable: true }),
    col("CheckedAt", "DATETIME2(0)"), col("Confidence", "DECIMAL(5,2)", { nullable: true }),
    col("Disposition", "VARCHAR(15)", { nullable: true, note: "Open/Confirmed/Dismissed" }), fk("ReviewedBy", "BIGINT", "Users.Id", { nullable: true }),
  ]},

  // ---- Purchasing & Contracts ----
  { name: "PurchaseOrders", module: "Purchasing & Contracts", columns: [
    pk(), col("PoNumber", "VARCHAR(20)", { unique: true, note: "PoBaseNumber+PoSuffix e.g. PO-2026-01077A" }),
    fk("PrId", "BIGINT", "PurchaseRequisitions.Id"), fk("VendorId", "BIGINT", "Vendors.Id"), fk("PoTypeId", "SMALLINT", "PoTypes.Id"),
    fk("PoStatusId", "SMALLINT", "PoStatuses.Id"), fk("ReplacesPoId", "BIGINT", "PurchaseOrders.Id", { nullable: true }),
    fk("CurrencyCode", "CHAR(3)", "Currencies.Code"), col("SubTotal", "DECIMAL(18,2)"), col("TaxTotal", "DECIMAL(18,2)", { default: "0" }),
    col("Total", "DECIMAL(18,2)"), col("RetentionPct", "DECIMAL(5,2)", { nullable: true }), col("DeliveryDate", "DATE"),
    col("PaymentTerms", "NVARCHAR(300)", { nullable: true }), col("IdempotencyKey", "UNIQUEIDENTIFIER", { unique: true }),
    col("IssuedAt", "DATETIME2(0)", { nullable: true }), col("RowVer", "ROWVERSION"), col("PoBaseNumber", "VARCHAR(16)"),
    col("PoSuffix", "CHAR(1)", { nullable: true }), fk("AdvanceTypeId", "SMALLINT", "AdvanceTypes.Id"),
    col("AdvancePct", "DECIMAL(5,2)", { nullable: true }), col("AdvanceAmount", "DECIMAL(18,2)", { nullable: true }),
    col("AdvancePaid", "DECIMAL(18,2)", { default: "0" }), fk("DispatchChannelId", "SMALLINT", "DispatchChannels.Id", { nullable: true }),
    col("DispatchedAt", "DATETIME2(0)", { nullable: true }), ...audit(),
  ], compositeUnique: [["PoBaseNumber", "PoSuffix"]] },
  { name: "PoLines", module: "Purchasing & Contracts", columns: [
    pk(), fk("PoId", "BIGINT", "PurchaseOrders.Id"), fk("PrLineId", "BIGINT", "PrLines.Id"),
    fk("QuotationLineId", "BIGINT", "QuotationLines.Id", { nullable: true }), col("Qty", "DECIMAL(18,3)"),
    col("UnitPrice", "DECIMAL(18,2)"), col("LineTotal", "DECIMAL(18,2)", { computed: "Qty * UnitPrice" }),
    col("AcceptedQty", "DECIMAL(18,3)", { default: "0" }), col("OutstandingQty", "DECIMAL(18,3)", { computed: "Qty - AcceptedQty" }),
  ]},
  { name: "Contracts", module: "Purchasing & Contracts", columns: [
    pk(), fk("PoId", "BIGINT", "PurchaseOrders.Id", { unique: true, note: "1:0..1" }), fk("ContractTypeId", "SMALLINT", "ContractTypes.Id"),
    col("Terms", "NVARCHAR(MAX)"), col("StartDate", "DATE", { nullable: true }), col("EndDate", "DATE", { nullable: true }),
    fk("GeneratedDocumentId", "BIGINT", "Documents.Id", { nullable: true }),
    fk("SignedDocumentId", "BIGINT", "Documents.Id", { nullable: true, note: "Mandatory before Active" }),
    fk("TemplateId", "BIGINT", "ContractTemplates.Id", { nullable: true }), col("GoverningLaw", "NVARCHAR(100)", { default: "'Laws of Pakistan'" }),
    col("CountryOfOrigin", "VARCHAR(60)", { nullable: true }), col("Incoterms", "VARCHAR(10)", { nullable: true }),
    col("ChequeNo", "VARCHAR(40)", { nullable: true, note: "Mandatory before Active" }), col("ChequeBank", "NVARCHAR(150)", { nullable: true }),
    col("ChequeAmount", "DECIMAL(18,2)", { nullable: true }), fk("ChequeDocumentId", "BIGINT", "Documents.Id", { nullable: true }),
    fk("ChequeStatusId", "SMALLINT", "SecurityDepositStatuses.Id", { nullable: true }), ...audit(),
  ]},
  { name: "PoAmendments", module: "Purchasing & Contracts", columns: [
    pk(), fk("PoId", "BIGINT", "PurchaseOrders.Id"), col("AmendmentNo", "INT"), fk("AmendmentTypeId", "SMALLINT", "AmendmentTypes.Id"),
    col("OldValue", "NVARCHAR(200)"), col("NewValue", "NVARCHAR(200)"), col("IsEscalation", "BIT"),
    col("Reason", "NVARCHAR(500)"), fk("ApprovedBy", "BIGINT", "Users.Id", { nullable: true }), ...audit(),
  ]},
  { name: "ContractTemplates", module: "Purchasing & Contracts", columns: [
    pk(), col("Code", "VARCHAR(30)", { unique: true }), col("Name", "NVARCHAR(150)"), fk("ContractTypeId", "SMALLINT", "ContractTypes.Id"),
    col("Version", "INT"), col("IsActive", "BIT", { default: "1" }), ...audit(),
  ]},
  { name: "ContractClauses", module: "Purchasing & Contracts", columns: [
    pk(), fk("TemplateId", "BIGINT", "ContractTemplates.Id"), fk("ClauseCategoryId", "SMALLINT", "ClauseCategories.Id"),
    col("Sequence", "INT"), col("Title", "NVARCHAR(150)"), col("Body", "NVARCHAR(MAX)", { note: "Placeholders like {Qty},{Item},{Origin}" }),
    col("IsMandatory", "BIT", { default: "1" }), ...audit(),
  ]},

  // ---- Receiving ----
  { name: "GoodsReceipts", module: "Receiving", columns: [
    pk(), col("GrnNumber", "VARCHAR(20)", { unique: true }), fk("PoId", "BIGINT", "PurchaseOrders.Id"),
    col("ReceivedOn", "DATE"), col("DeliveryNoteNo", "VARCHAR(40)"), fk("ReceivedBy", "BIGINT", "Users.Id"),
    col("IsLate", "BIT", { default: "0" }), fk("DeliveryNoteDocumentId", "BIGINT", "Documents.Id", { nullable: true }),
    col("OnTime", "BIT", { nullable: true }), col("QualityRating", "TINYINT", { nullable: true, note: "1-5, given at acknowledgement" }),
    fk("AcknowledgedBy", "BIGINT", "Users.Id", { nullable: true }), col("AcknowledgedAt", "DATETIME2(0)", { nullable: true }),
    col("AckRemarks", "NVARCHAR(500)", { nullable: true }), col("AckStatus", "VARCHAR(15)", { nullable: true, note: "Accepted/Disputed" }),
    col("DisputeReason", "NVARCHAR(500)", { nullable: true, note: "Required when Disputed - returns to Procurement" }), ...audit(),
  ]},
  { name: "GoodsReceiptLines", module: "Receiving", columns: [
    pk(), fk("GrnId", "BIGINT", "GoodsReceipts.Id"), fk("PoLineId", "BIGINT", "PoLines.Id"), col("DeliveredQty", "DECIMAL(18,3)"),
    col("AcceptedQty", "DECIMAL(18,3)"), col("RejectedQty", "DECIMAL(18,3)", { default: "0" }),
    col("RejectReason", "NVARCHAR(300)", { nullable: true }), fk("EvidenceDocumentId", "BIGINT", "Documents.Id", { nullable: true }),
  ]},

  // ---- Bills ----
  { name: "SupplierInvoices", module: "Bills", columns: [
    pk(), col("InvoiceNo", "VARCHAR(30)", { unique: true }), fk("VendorId", "BIGINT", "Vendors.Id"),
    col("VendorInvoiceRef", "VARCHAR(60)"), col("VendorRefNormalized", "VARCHAR(60)", { note: "Unique with VendorId" }),
    fk("PrId", "BIGINT", "PurchaseRequisitions.Id"), fk("PoId", "BIGINT", "PurchaseOrders.Id", { nullable: true, note: "Null only for bill-type PRs" }),
    col("InvoiceDate", "DATE"), fk("CurrencyCode", "CHAR(3)", "Currencies.Code"), col("Total", "DECIMAL(18,2)"),
    fk("DocumentId", "BIGINT", "Documents.Id"), fk("UploadedBy", "BIGINT", "Users.Id"),
    col("ForwardedToFinanceAt", "DATETIME2(0)", { nullable: true }), fk("ForwardedBy", "BIGINT", "Users.Id", { nullable: true }),
    col("BillStatus", "VARCHAR(20)", { note: "Uploaded/Forwarded/Rejected" }), col("FinancePortalRef", "VARCHAR(60)", { nullable: true }),
    col("PaidAmount", "DECIMAL(18,2)", { default: "0", note: "Read-only, written only by Finance Portal sync" }),
    col("IsFullyPaid", "BIT", { computed: "PaidAmount >= Total" }), col("PaidAt", "DATETIME2(0)", { nullable: true, note: "Read-only" }),
    fk("ProofDocumentId", "BIGINT", "Documents.Id", { nullable: true, note: "Returned by Finance Portal" }), ...audit(),
  ], compositeUnique: [["VendorId", "VendorRefNormalized"]] },

  // ---- Audit & Compliance ----
  { name: "AuditQueries", module: "Audit & Compliance", columns: [
    pk(), fk("EntityTypeId", "SMALLINT", "EntityTypes.Id"), col("EntityId", "BIGINT"), fk("RaisedBy", "BIGINT", "Users.Id"),
    fk("AssignedRoleId", "BIGINT", "Roles.Id"), fk("AssignedUserId", "BIGINT", "Users.Id", { nullable: true }),
    col("QueryText", "NVARCHAR(2000)"), col("ResponseText", "NVARCHAR(2000)", { nullable: true }),
    fk("QueryStatusId", "SMALLINT", "QueryStatuses.Id"), col("RespondedAt", "DATETIME2(0)", { nullable: true }), ...audit(),
  ]},
  { name: "AuditEvents", module: "Audit & Compliance", columns: [
    pk(), col("OccurredAt", "DATETIME2(3)"), fk("ActorUserId", "BIGINT", "Users.Id", { nullable: true }),
    fk("ActorRoleId", "BIGINT", "Roles.Id", { nullable: true }), col("Action", "VARCHAR(60)"),
    fk("EntityTypeId", "SMALLINT", "EntityTypes.Id"), col("EntityId", "BIGINT", { nullable: true }),
    col("Outcome", "VARCHAR(10)", { note: "Allowed/Denied" }), col("BeforeJson", "NVARCHAR(MAX)", { nullable: true }),
    col("AfterJson", "NVARCHAR(MAX)", { nullable: true }), col("CorrelationId", "UNIQUEIDENTIFIER"), col("IpAddress", "VARCHAR(45)", { nullable: true }),
  ], appendOnly: true },
  { name: "AuditStamps", module: "Audit & Compliance", columns: [
    pk(), fk("PrId", "BIGINT", "PurchaseRequisitions.Id", { unique: true, note: "1:0..1" }), col("PaymentVerified", "BIT"),
    col("DeliveryVerified", "BIT"), fk("StampedBy", "BIGINT", "Users.Id"), col("StampedAt", "DATETIME2(0)"),
    col("Remarks", "NVARCHAR(500)", { nullable: true }),
  ], appendOnly: true },
  { name: "MonthEndAudits", module: "Audit & Compliance", columns: [
    pk(), col("Period", "CHAR(7)", { unique: true, note: "YYYY-MM" }), fk("StatusId", "SMALLINT", "MonthEndAuditStatuses.Id"),
    fk("StartedBy", "BIGINT", "Users.Id"), fk("CompletedBy", "BIGINT", "Users.Id", { nullable: true }),
    col("CompletedAt", "DATETIME2(0)", { nullable: true }), col("Summary", "NVARCHAR(1000)", { nullable: true }), ...audit(),
  ]},
  { name: "MonthEndAuditItems", module: "Audit & Compliance", columns: [
    pk(), fk("MonthEndAuditId", "BIGINT", "MonthEndAudits.Id"), fk("PrId", "BIGINT", "PurchaseRequisitions.Id"),
    fk("BillId", "BIGINT", "SupplierInvoices.Id", { nullable: true }), col("WasPreAudited", "BIT"), col("Finding", "NVARCHAR(500)", { nullable: true }),
  ]},

  // ---- Recurring ----
  { name: "RecurringPlans", module: "Recurring", columns: [
    pk(), col("PlanNo", "VARCHAR(20)", { unique: true }), fk("RecurringPlanTypeId", "SMALLINT", "RecurringPlanTypes.Id"),
    fk("SpendSubHeadId", "BIGINT", "SpendSubHeads.Id"), fk("DepartmentId", "BIGINT", "Departments.Id"), fk("LocationId", "BIGINT", "Locations.Id"),
    fk("OwnerUserId", "BIGINT", "Users.Id"), fk("FrequencyId", "SMALLINT", "RecurringFrequencies.Id"), col("GenerationDay", "TINYINT"),
    col("DueOffsetDays", "INT", { default: "10" }), col("StartDate", "DATE"), col("EndDate", "DATE", { nullable: true }),
    col("CurrentVersionNo", "INT", { default: "1" }), fk("StatusId", "SMALLINT", "ApprovalRequestStatuses.Id"),
    col("NextRunDate", "DATE", { nullable: true }), fk("VendorId", "BIGINT", "Vendors.Id", { nullable: true }),
    col("FixedAmount", "DECIMAL(18,2)", { nullable: true }), fk("ApprovedBy", "BIGINT", "Users.Id", { nullable: true }), ...audit(),
  ]},
  { name: "RecurringPlanLines", module: "Recurring", columns: [
    pk(), fk("PlanId", "BIGINT", "RecurringPlans.Id"), fk("ItemId", "BIGINT", "Items.Id"), col("Qty", "DECIMAL(18,3)"),
    fk("UnitId", "BIGINT", "Units.Id"), col("AgreedPrice", "DECIMAL(18,2)", { nullable: true }),
  ]},
  { name: "RecurringOccurrences", module: "Recurring", columns: [
    pk(), fk("PlanId", "BIGINT", "RecurringPlans.Id"), col("PlanVersionNo", "INT"),
    col("OccurrenceKey", "VARCHAR(20)", { note: "e.g. 2026-11" }), col("ScheduledFor", "DATE"),
    fk("OccurrenceStatusId", "SMALLINT", "OccurrenceStatuses.Id"), fk("GeneratedPrId", "BIGINT", "PurchaseRequisitions.Id", { nullable: true }),
    col("GeneratedAt", "DATETIME2(0)", { nullable: true }), col("Error", "NVARCHAR(500)", { nullable: true }),
  ], unique: ["PlanId", "OccurrenceKey"] },

  // ---- Notifications ----
  { name: "Notifications", module: "Notifications", columns: [
    pk(), fk("UserId", "BIGINT", "Users.Id", { nullable: true }), fk("RoleId", "BIGINT", "Roles.Id", { nullable: true }),
    fk("EntityTypeId", "SMALLINT", "EntityTypes.Id"), col("EntityId", "BIGINT"), col("Message", "NVARCHAR(300)"),
    col("IsRead", "BIT", { default: "0" }), col("CreatedAt", "DATETIME2(0)"), fk("NotificationTypeId", "SMALLINT", "NotificationTypes.Id"),
    col("Channel", "VARCHAR(10)", { default: "'InApp'", note: "InApp/Email/WhatsApp" }),
    col("DedupeKey", "VARCHAR(100)", { unique: true, note: "Stops duplicate alerts on retry" }), col("SentAt", "DATETIME2(0)", { nullable: true }),
  ]},
  { name: "OutboxMessages", module: "Notifications", columns: [
    pk(), col("MessageType", "VARCHAR(60)"), col("Payload", "NVARCHAR(MAX)"), col("CreatedAt", "DATETIME2(3)"),
    col("ProcessedAt", "DATETIME2(3)", { nullable: true }), col("Attempts", "INT", { default: "0" }),
    col("NextAttemptAt", "DATETIME2(3)", { nullable: true }), col("LastError", "NVARCHAR(1000)", { nullable: true }),
  ]},
];

module.exports = { lookups, entities, col, pk, fk, audit };
