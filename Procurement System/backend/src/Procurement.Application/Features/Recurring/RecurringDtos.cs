using MediatR;

namespace Procurement.Application.Features.Recurring;

public record RecurringPlanLineInput(long ItemId, decimal Qty, long UnitId, decimal? AgreedPrice);

public record CreateRecurringPlanCommand(
    string RecurringPlanTypeCode, long SpendSubHeadId, long DepartmentId, long LocationId, long OwnerUserId,
    string FrequencyCode, byte GenerationDay, int DueOffsetDays, DateOnly StartDate, DateOnly? EndDate,
    long? VendorId, decimal? FixedAmount, List<RecurringPlanLineInput>? Lines) : IRequest<long>;

public record RecurringPlanDto(
    long Id, string PlanNo, string RecurringPlanTypeCode, string SpendSubHeadName, string DepartmentName,
    string OwnerName, string FrequencyCode, DateOnly StartDate, DateOnly? EndDate, string StatusCode, decimal? FixedAmount);
