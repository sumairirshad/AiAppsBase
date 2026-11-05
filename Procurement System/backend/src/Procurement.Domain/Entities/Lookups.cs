namespace Procurement.Domain.Entities;

public class PrStatuses : TerminalLookupEntity { }
public class PoStatuses : TerminalLookupEntity { }
public class VendorStatuses : TerminalLookupEntity { }
public class ApprovalRequestStatuses : TerminalLookupEntity { }
public class TaskStatuses : TerminalLookupEntity { }
public class QueryStatuses : TerminalLookupEntity { }
public class SecurityDepositStatuses : TerminalLookupEntity { }
public class MonthEndAuditStatuses : TerminalLookupEntity { }

public class CostTypes : LookupEntity { }
public class ProcurementModes : LookupEntity { }
public class PoTypes : LookupEntity { }
public class ActionTypes : LookupEntity { }
public class StageTypes : LookupEntity { }
public class DocumentTypes : LookupEntity { }
public class RecurringFrequencies : LookupEntity { }
public class RecurringPlanTypes : LookupEntity { }
public class OccurrenceStatuses : LookupEntity { }
public class DispatchChannels : LookupEntity { }
public class ContractTypes : LookupEntity { }
public class CommentTypes : LookupEntity { }
public class NotificationTypes : LookupEntity { }
public class ClauseCategories : LookupEntity { }
public class AmendmentTypes : LookupEntity { }
public class AdvanceTypes : LookupEntity { }
public class AiCheckTypes : LookupEntity { }

public class Currencies
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public bool IsActive { get; set; } = true;
}

public class EntityTypes : LookupEntity
{
    public string TableName { get; set; } = default!;
}
