using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Recurring;

public class CreateRecurringPlanCommandHandler : IRequestHandler<CreateRecurringPlanCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;

    public CreateRecurringPlanCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<long> Handle(CreateRecurringPlanCommand request, CancellationToken ct)
    {
        if (!await _currentUser.HasRoleAsync(RoleCodes.Opd))
        {
            throw new ForbiddenAccessException("Only OPD may set up a recurring plan.");
        }
        if (request.RecurringPlanTypeCode == RecurringPlanTypeCodes.Items && (request.Lines == null || request.Lines.Count == 0))
        {
            throw new BusinessRuleException("An items-type recurring plan needs at least one basket line.");
        }
        if (request.RecurringPlanTypeCode == RecurringPlanTypeCodes.Bill && request.FixedAmount == null)
        {
            throw new BusinessRuleException("A bill-type recurring plan needs a fixed amount.");
        }

        var planType = await _db.RecurringPlanTypes.FirstAsync(t => t.Code == request.RecurringPlanTypeCode, ct);
        var frequency = await _db.RecurringFrequencies.FirstAsync(f => f.Code == request.FrequencyCode, ct);
        var approvedStatus = await _db.ApprovalRequestStatuses.FirstAsync(s => s.Code == ApprovalRequestStatusCodes.Approved, ct);
        var now = DateTime.UtcNow;

        var plan = new RecurringPlans
        {
            PlanNo = $"RP-{DateTime.UtcNow.Year}-{(await _db.GetNextSequenceValueAsync("seq_pr", ct)):D5}",
            RecurringPlanTypeId = planType.Id,
            SpendSubHeadId = request.SpendSubHeadId,
            DepartmentId = request.DepartmentId,
            LocationId = request.LocationId,
            OwnerUserId = request.OwnerUserId,
            FrequencyId = frequency.Id,
            GenerationDay = request.GenerationDay,
            DueOffsetDays = request.DueOffsetDays,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            CurrentVersionNo = 1,
            StatusId = approvedStatus.Id,
            VendorId = request.VendorId,
            FixedAmount = request.FixedAmount,
            ApprovedBy = _currentUser.UserId,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        };
        _db.RecurringPlans.Add(plan);
        await _db.SaveChangesAsync(ct);

        if (request.Lines != null)
        {
            foreach (var line in request.Lines)
            {
                _db.RecurringPlanLines.Add(new RecurringPlanLines
                {
                    PlanId = plan.Id, ItemId = line.ItemId, Qty = line.Qty, UnitId = line.UnitId, AgreedPrice = line.AgreedPrice,
                });
            }
            await _db.SaveChangesAsync(ct);
        }

        return plan.Id;
    }
}

public record ListRecurringPlansQuery : IRequest<List<RecurringPlanDto>>;

public class ListRecurringPlansQueryHandler : IRequestHandler<ListRecurringPlansQuery, List<RecurringPlanDto>>
{
    private readonly IProcurementDbContext _db;
    public ListRecurringPlansQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<RecurringPlanDto>> Handle(ListRecurringPlansQuery request, CancellationToken ct)
    {
        var plans = await _db.RecurringPlans.ToListAsync(ct);
        var types = await _db.RecurringPlanTypes.ToDictionaryAsync(t => t.Id, ct);
        var subHeads = await _db.SpendSubHeads.ToDictionaryAsync(s => s.Id, ct);
        var departments = await _db.Departments.ToDictionaryAsync(d => d.Id, ct);
        var users = await _db.Users.ToDictionaryAsync(u => u.Id, ct);
        var frequencies = await _db.RecurringFrequencies.ToDictionaryAsync(f => f.Id, ct);
        var statuses = await _db.ApprovalRequestStatuses.ToDictionaryAsync(s => s.Id, ct);

        return plans.Select(p => new RecurringPlanDto(
            p.Id, p.PlanNo, types[p.RecurringPlanTypeId].Code, subHeads[p.SpendSubHeadId].Name, departments[p.DepartmentId].Name,
            users[p.OwnerUserId].DisplayName, frequencies[p.FrequencyId].Code, p.StartDate, p.EndDate, statuses[p.StatusId].Code, p.FixedAmount)).ToList();
    }
}
