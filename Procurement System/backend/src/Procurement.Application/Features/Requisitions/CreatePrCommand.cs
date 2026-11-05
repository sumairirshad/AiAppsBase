using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Common.Numbering;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Requisitions;

public record CreatePrCommand(
    long DepartmentId, long LocationId, long SpendSubHeadId, long? ProjectId, bool IsTentative,
    bool IsEmergency, string? EmergencyJustification, string Title,
    List<PrLineInput>? Lines,
    string? BillingPeriod, decimal? BillAmount, string? Purpose, DateOnly? DueDate, long? BillDocumentId) : IRequest<long>;

public class CreatePrCommandHandler : IRequestHandler<CreatePrCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;

    public CreatePrCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<long> Handle(CreatePrCommand request, CancellationToken ct)
    {
        await PrGuards.EnsureDepartmentAccessAsync(_db, _currentUser, request.DepartmentId, ct);

        var subHead = await _db.SpendSubHeads.Include(s => s.WorkflowDefinition)
            .FirstOrDefaultAsync(s => s.Id == request.SpendSubHeadId, ct)
            ?? throw new NotFoundException("SpendSubHead", request.SpendSubHeadId);
        var procurementMode = await _db.ProcurementModes.FirstAsync(m => m.Id == subHead.ProcurementModeId, ct);
        var isBillRoute = procurementMode.Code is ProcurementModeCodes.Bill or ProcurementModeCodes.PolicyClaim or ProcurementModeCodes.RecurringBill;

        if (request.IsEmergency && subHead.Code != SpendSubHeadCodes.AprFault)
        {
            throw new BusinessRuleException("Emergency may only be flagged on a Fault purchase requisition.");
        }
        if (request.IsEmergency && string.IsNullOrWhiteSpace(request.EmergencyJustification))
        {
            throw new BusinessRuleException("An emergency purchase requisition requires a justification.");
        }
        if (request.IsTentative && !subHead.AllowsTentative)
        {
            throw new BusinessRuleException("This spend sub-head does not allow a tentative cost.");
        }

        decimal estimatedAmount;
        var now = DateTime.UtcNow;
        var draftStatus = await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.Draft, ct);
        var costType = await _db.CostTypes.FirstAsync(c => c.Code == (request.IsTentative ? CostTypeCodes.Tentative : CostTypeCodes.Final), ct);
        var isOpd = await _currentUser.HasRoleAsync(RoleCodes.Opd);
        var raisedOnBehalf = isOpd && request.DepartmentId != await _currentUser.GetDepartmentIdAsync();

        var pr = new PurchaseRequisitions
        {
            PrNumber = await DocumentNumberGenerator.NextAsync(_db, "seq_pr", "PR", 5, ct),
            RequesterId = _currentUser.UserId,
            DepartmentId = request.DepartmentId,
            LocationId = request.LocationId,
            SpendSubHeadId = subHead.Id,
            ProjectId = request.ProjectId,
            CostTypeId = costType.Id,
            IsEmergency = request.IsEmergency,
            EmergencyJustification = request.EmergencyJustification,
            Title = request.Title,
            CurrencyCode = "PKR",
            PrStatusId = draftStatus.Id,
            RaisedOnBehalf = raisedOnBehalf,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
            EstimatedAmount = 0,
        };

        if (isBillRoute)
        {
            if (request.BillAmount == null || request.BillDocumentId == null || request.DueDate == null || string.IsNullOrWhiteSpace(request.BillingPeriod))
            {
                throw new BusinessRuleException("Billing period, amount, due date and the bill document are required for this spend type.");
            }
            estimatedAmount = request.BillAmount.Value;
        }
        else
        {
            if (request.Lines == null || request.Lines.Count == 0)
            {
                throw new BusinessRuleException("At least one item line is required.");
            }

            foreach (var line in request.Lines)
            {
                var item = await _db.Items.FirstOrDefaultAsync(i => i.Id == line.ItemId, ct) ?? throw new NotFoundException("Item", line.ItemId);
                await PrGuards.EnsureCategoryAllowedAsync(_db, _currentUser, request.DepartmentId, item.CategoryId, ct);
                if (!request.IsEmergency)
                {
                    await PrGuards.EnsureNoDuplicateOpenLineAsync(_db, line.ItemId, line.LocationId, ct);
                }
            }
            estimatedAmount = request.Lines.Sum(l => l.Qty * l.EstUnitPrice);
        }

        pr.EstimatedAmount = estimatedAmount;
        _db.PurchaseRequisitions.Add(pr);
        await _db.SaveChangesAsync(ct);

        if (isBillRoute)
        {
            _db.PrBills.Add(new PrBills
            {
                PrId = pr.Id,
                BillingPeriod = request.BillingPeriod!,
                BillAmount = request.BillAmount!.Value,
                Purpose = request.Purpose ?? string.Empty,
                DueDate = request.DueDate!.Value,
                BillDocumentId = request.BillDocumentId!.Value,
                CreatedByUserId = _currentUser.UserId,
                CreatedAt = now,
            });
        }
        else
        {
            var lineNo = 1;
            foreach (var line in request.Lines!)
            {
                _db.PrLines.Add(new PrLines
                {
                    PrId = pr.Id,
                    LineNo = lineNo++,
                    ItemId = line.ItemId,
                    Description = line.Description,
                    Qty = line.Qty,
                    UnitId = line.UnitId,
                    EstUnitPrice = line.EstUnitPrice,
                    LocationId = line.LocationId,
                    CreatedByUserId = _currentUser.UserId,
                    CreatedAt = now,
                });
            }
        }

        await _db.SaveChangesAsync(ct);
        return pr.Id;
    }
}
