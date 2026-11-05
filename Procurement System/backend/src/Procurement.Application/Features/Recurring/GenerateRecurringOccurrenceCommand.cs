using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Common.Numbering;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Recurring;

public record GenerateRecurringOccurrenceCommand(long PlanId) : IRequest<long>;

/// <summary>Generates (at most once per plan per period - UNIQUE(PlanId, OccurrenceKey) keeps this idempotent
/// even if called twice) the PR for the plan's current period: a Bill-type plan's PR starts AwaitingBill until
/// the owner attaches the bill (see AttachCyclicBillCommand); an Items-type plan's PR starts Draft with lines
/// from the plan's basket, ready for the normal submit flow.</summary>
public class GenerateRecurringOccurrenceCommandHandler : IRequestHandler<GenerateRecurringOccurrenceCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;

    public GenerateRecurringOccurrenceCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<long> Handle(GenerateRecurringOccurrenceCommand request, CancellationToken ct)
    {
        var plan = await _db.RecurringPlans.FirstOrDefaultAsync(p => p.Id == request.PlanId, ct)
            ?? throw new NotFoundException("RecurringPlan", request.PlanId);

        var now = DateTime.UtcNow;
        var occurrenceKey = $"{now:yyyy}-{now:MM}";
        if (await _db.RecurringOccurrences.AnyAsync(o => o.PlanId == plan.Id && o.OccurrenceKey == occurrenceKey, ct))
        {
            throw new ConflictException($"An occurrence for {occurrenceKey} has already been generated for this plan.");
        }

        var planType = await _db.RecurringPlanTypes.FirstAsync(t => t.Id == plan.RecurringPlanTypeId, ct);
        var isBillType = planType.Code == RecurringPlanTypeCodes.Bill;

        var draftStatus = await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.Draft, ct);
        var awaitingBillStatus = await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.AwaitingBill, ct);
        var finalCostType = await _db.CostTypes.FirstAsync(c => c.Code == CostTypeCodes.Final, ct);

        var pr = new PurchaseRequisitions
        {
            PrNumber = await DocumentNumberGenerator.NextAsync(_db, "seq_pr", "PR", 5, ct),
            RequesterId = plan.OwnerUserId,
            DepartmentId = plan.DepartmentId,
            LocationId = plan.LocationId,
            SpendSubHeadId = plan.SpendSubHeadId,
            CostTypeId = finalCostType.Id,
            Title = $"Recurring: {occurrenceKey}",
            CurrencyCode = "PKR",
            EstimatedAmount = isBillType ? (plan.FixedAmount ?? 0) : 0,
            PrStatusId = isBillType ? awaitingBillStatus.Id : draftStatus.Id,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        };
        _db.PurchaseRequisitions.Add(pr);
        await _db.SaveChangesAsync(ct);

        if (!isBillType)
        {
            var lines = await _db.RecurringPlanLines.Where(l => l.PlanId == plan.Id).ToListAsync(ct);
            var lineNo = 1;
            decimal total = 0;
            foreach (var line in lines)
            {
                var unitPrice = line.AgreedPrice ?? 0;
                total += line.Qty * unitPrice;
                _db.PrLines.Add(new PrLines
                {
                    PrId = pr.Id, LineNo = lineNo++, ItemId = line.ItemId, Qty = line.Qty, UnitId = line.UnitId,
                    EstUnitPrice = unitPrice, LocationId = plan.LocationId, SuggestedVendorId = plan.VendorId,
                    CreatedByUserId = _currentUser.UserId, CreatedAt = now,
                });
            }
            pr.EstimatedAmount = total;
        }

        var scheduledStatus = await _db.OccurrenceStatuses.FirstAsync(s => s.Code == OccurrenceStatusCodes.Generated, ct);
        var occurrence = new RecurringOccurrences
        {
            PlanId = plan.Id,
            PlanVersionNo = plan.CurrentVersionNo,
            OccurrenceKey = occurrenceKey,
            ScheduledFor = DateOnly.FromDateTime(now),
            OccurrenceStatusId = scheduledStatus.Id,
            GeneratedPrId = pr.Id,
            GeneratedAt = now,
        };
        _db.RecurringOccurrences.Add(occurrence);

        await _db.SaveChangesAsync(ct);

        pr.RecurringOccurrenceId = occurrence.Id;
        await _db.SaveChangesAsync(ct);

        return pr.Id;
    }
}

public record AttachCyclicBillCommand(long PrId, string BillingPeriod, decimal BillAmount, string Purpose, DateOnly DueDate, long BillDocumentId) : IRequest;

public class AttachCyclicBillCommandHandler : IRequestHandler<AttachCyclicBillCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;

    public AttachCyclicBillCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(AttachCyclicBillCommand request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        var awaitingBillStatus = await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.AwaitingBill, ct);
        if (pr.PrStatusId != awaitingBillStatus.Id)
        {
            throw new BusinessRuleException("This purchase requisition is not awaiting a bill.");
        }
        if (pr.RequesterId != _currentUser.UserId)
        {
            throw new ForbiddenAccessException("Only the plan owner may attach the bill for this occurrence.");
        }

        var now = DateTime.UtcNow;
        _db.PrBills.Add(new PrBills
        {
            PrId = pr.Id, BillingPeriod = request.BillingPeriod, BillAmount = request.BillAmount, Purpose = request.Purpose,
            DueDate = request.DueDate, BillDocumentId = request.BillDocumentId, CreatedByUserId = _currentUser.UserId, CreatedAt = now,
        });

        pr.EstimatedAmount = request.BillAmount;
        pr.PrStatusId = (await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.Draft, ct)).Id;
        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
    }
}
