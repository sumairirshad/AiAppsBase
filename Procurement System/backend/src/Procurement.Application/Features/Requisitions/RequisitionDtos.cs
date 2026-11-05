namespace Procurement.Application.Features.Requisitions;

public record PrLineInput(long ItemId, string? Description, decimal Qty, long UnitId, decimal EstUnitPrice, long LocationId);

public record PrLineDto(long Id, int LineNo, long ItemId, string ItemName, string? Description, decimal Qty, string UnitCode, decimal EstUnitPrice, decimal LineTotal, long LocationId, string LocationName, long? SuggestedVendorId, long? AwardedVendorId, decimal AcceptedQty);

public record PrTimelineEntryDto(DateTime ActedAt, string ActorName, string RoleName, string Action, string? FromStage, string? ToStage, string? Remarks);

public record PrDto(
    long Id, string PrNumber, long RequesterId, string RequesterName, long DepartmentId, string DepartmentName,
    long LocationId, string LocationName, string SpendSubHeadCode, string SpendSubHeadName, string CostTypeCode,
    bool IsEmergency, string? EmergencyJustification, string Title, decimal EstimatedAmount, decimal? ApprovedAmount,
    decimal? FinalAmount, string PrStatusCode, string PrStatusName, DateTime CreatedAt, DateTime? SubmittedAt,
    DateTime? ClosedAt, bool RaisedOnBehalf, List<PrLineDto> Lines, string? BillingPeriod, decimal? BillAmount,
    string? Purpose, DateOnly? DueDate, string? CurrentStageCode, string? CurrentStageRoleCode, long? WorkflowInstanceId);

public record PrListItemDto(
    long Id, string PrNumber, string RequesterName, string DepartmentName, string SpendSubHeadName,
    string Title, decimal EstimatedAmount, string PrStatusCode, string PrStatusName, DateTime CreatedAt, string? CurrentStageCode);
