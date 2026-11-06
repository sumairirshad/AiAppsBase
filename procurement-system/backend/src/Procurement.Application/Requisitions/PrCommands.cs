using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Requisitions;

// BR-045: a Bill / Cyclic On-Usage / As-Policy PR has no items - just the billing period,
// amount, purpose, due date and the bill document(s). ProcurementModes Bill/PolicyClaim/
// RecurringBill sub-heads use this instead of Lines.
// PayeeVendorId: who the bill is payable to (the utility company, the insurer, ...) - reuses
// the same Vendors/SupplierInvoices/Finance-Portal/Audit-stamp machinery as the purchase
// cycle instead of a second, parallel payment-tracking path.
public record PrBillInput(string BillingPeriod, decimal BillAmount, string Purpose, DateOnly DueDate, long BillDocumentId, long PayeeVendorId);

public record CreatePrCommand(
    long ActorUserId, long DepartmentId, long LocationId, string SpendSubHeadCode, long? ProjectId,
    string CostTypeCode, bool IsEmergency, string? EmergencyJustification, string Title,
    List<PrLineInput> Lines, PrBillInput? Bill = null) : IRequest<long>;

public class CreatePrValidator : AbstractValidator<CreatePrCommand>
{
    public CreatePrValidator()
    {
        RuleFor(x => x.Title).NotEmpty();
        RuleFor(x => x).Must(x => x.Bill is not null || x.Lines.Count > 0)
            .WithMessage("A PR needs either a bill or at least one line.");
        RuleForEach(x => x.Lines).ChildRules(line =>
        {
            line.RuleFor(l => l.Qty).GreaterThan(0);
            line.RuleFor(l => l.EstUnitPrice).GreaterThanOrEqualTo(0);
        });
        RuleFor(x => x.EmergencyJustification).NotEmpty().When(x => x.IsEmergency)
            .WithMessage("An emergency flag needs a justification.");
    }
}

public class CreatePrHandler : IRequestHandler<CreatePrCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly UserAccessService _access;
    private readonly LookupCache _lookups;
    private readonly IDocumentNumberGenerator _numbers;
    private readonly PrPriceGuidanceService _priceGuidance;

    public CreatePrHandler(IApplicationDbContext db, UserAccessService access, LookupCache lookups, IDocumentNumberGenerator numbers, PrPriceGuidanceService priceGuidance)
    {
        _db = db;
        _access = access;
        _lookups = lookups;
        _numbers = numbers;
        _priceGuidance = priceGuidance;
    }

    public async Task<long> Handle(CreatePrCommand request, CancellationToken ct)
    {
        // BR-002/BR-003: department access (OPD exempt, and flagged as raised on behalf).
        var isOpd = await _access.HasRoleAsync(request.ActorUserId, "OPD", null, ct);
        if (!isOpd && !await _access.CanRaiseForDepartmentAsync(request.ActorUserId, request.DepartmentId, ct))
            throw new UnauthorizedAccessException("You do not have access to raise a PR for this department.");

        var subHead = await _db.SpendSubHeads.FirstOrDefaultAsync(s => s.Code == request.SpendSubHeadCode, ct)
            ?? throw new InvalidOperationException($"Unknown spend sub-head '{request.SpendSubHeadCode}'.");
        var costTypeId = await _lookups.IdAsync<CostTypes, short>(request.CostTypeCode, ct);
        var draftStatus = await _lookups.IdAsync<PrStatuses, short>("Draft", ct);
        var policyVersionId = await _db.PolicyVersions.OrderByDescending(p => p.Id).Select(p => p.Id).FirstAsync(ct);

        var pr = new PurchaseRequisitions
        {
            PrNumber = await _numbers.NextAsync(DocumentSequence.Pr, ct),
            RequesterId = request.ActorUserId,
            DepartmentId = request.DepartmentId,
            LocationId = request.LocationId,
            SpendSubHeadId = subHead.Id,
            ProjectId = request.ProjectId,
            CostTypeId = costTypeId,
            IsEmergency = request.IsEmergency,
            EmergencyJustification = request.EmergencyJustification,
            Title = request.Title,
            EstimatedAmount = request.Bill?.BillAmount ?? request.Lines.Sum(l => l.Qty * l.EstUnitPrice),
            PrStatusId = draftStatus,
            PolicyVersionId = policyVersionId,
            RaisedOnBehalf = isOpd,
            CreatedBy = request.ActorUserId,
        };
        _db.PurchaseRequisitions.Add(pr);
        await _db.SaveChangesAsync(ct);

        if (request.Bill is not null)
        {
            _db.Set<PrBills>().Add(new PrBills
            {
                PrId = pr.Id,
                BillingPeriod = request.Bill.BillingPeriod,
                BillAmount = request.Bill.BillAmount,
                Purpose = request.Bill.Purpose,
                DueDate = request.Bill.DueDate,
                BillDocumentId = request.Bill.BillDocumentId,
                PayeeVendorId = request.Bill.PayeeVendorId,
                CreatedBy = request.ActorUserId,
            });
            await _db.SaveChangesAsync(ct);
        }

        var lineNo = 1;
        foreach (var line in request.Lines)
        {
            // BR-004: each line's category must be mapped to the PR's department (OPD exempt).
            if (!isOpd)
            {
                var item = await _db.Items.FirstOrDefaultAsync(i => i.Id == line.ItemId, ct)
                    ?? throw new InvalidOperationException($"Item {line.ItemId} not found.");
                if (!await _access.IsCategoryAllowedForDepartmentAsync(request.DepartmentId, item.CategoryId, ct))
                    throw new UnauthorizedAccessException($"Item {line.ItemId}'s category is not allowed for this department.");
            }

            var guidance = await _priceGuidance.GetAsync(line.ItemId, request.LocationId, line.EstUnitPrice, policyVersionId, ct);
            long? suggested = line.SuggestedVendorId;

            _db.PrLines.Add(new PrLines
            {
                PrId = pr.Id,
                LineNo = lineNo++,
                ItemId = line.ItemId,
                Description = line.Description,
                Qty = line.Qty,
                UnitId = line.UnitId,
                EstUnitPrice = line.EstUnitPrice,
                SuggestedVendorId = suggested,
                LocationId = request.LocationId,
                MarketPriceAtRequest = guidance.MarketPrice,
                LastPaidPriceAtRequest = guidance.LastPaidPrice,
                PriceWarningPct = guidance.WarningPct,
                CreatedBy = request.ActorUserId,
            });
        }
        await _db.SaveChangesAsync(ct);
        return pr.Id;
    }
}

public record SubmitPrCommand(long ActorUserId, long PrId) : IRequest<SubmitPrResult>;
public record SubmitPrResult(string PrStatus, string? NextRole);

public class SubmitPrHandler : IRequestHandler<SubmitPrCommand, SubmitPrResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IWorkflowEngine _workflow;
    private readonly LookupCache _lookups;
    private readonly UserAccessService _access;

    public SubmitPrHandler(IApplicationDbContext db, IWorkflowEngine workflow, LookupCache lookups, UserAccessService access)
    {
        _db = db;
        _workflow = workflow;
        _lookups = lookups;
        _access = access;
    }

    public async Task<SubmitPrResult> Handle(SubmitPrCommand request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        if (pr.RequesterId != request.ActorUserId && !await _access.HasRoleAsync(request.ActorUserId, "OPD", null, ct))
            throw new UnauthorizedAccessException("Only the requester (or OPD) can submit this PR.");

        var draftStatus = await _lookups.IdAsync<PrStatuses, short>("Draft", ct);
        var returnedStatus = await _lookups.IdAsync<PrStatuses, short>("Returned", ct);
        if (pr.PrStatusId != draftStatus && pr.PrStatusId != returnedStatus)
            throw new InvalidOperationException("Only a Draft or Returned PR can be submitted.");

        var wasReturned = pr.PrStatusId == returnedStatus;

        var lines = await _db.PrLines.Where(l => l.PrId == pr.Id).ToListAsync(ct);
        foreach (var line in lines)
        {
            // BR-014: block a second open PR for the same item at the same location.
            var closedCodes = new[] { "Closed", "Rejected", "Cancelled" };
            var closedIds = await _db.PrStatuses.Where(s => closedCodes.Contains(s.Code)).Select(s => s.Id).ToListAsync(ct);
            var duplicate = await _db.PrLines.AnyAsync(l =>
                l.ItemId == line.ItemId && l.LocationId == line.LocationId && l.PrId != pr.Id &&
                _db.PurchaseRequisitions.Any(p => p.Id == l.PrId && !closedIds.Contains(p.PrStatusId)), ct);
            if (duplicate)
            {
                _db.Set<AiChecks>().Add(new AiChecks
                {
                    CheckTypeId = await _lookups.IdAsync<AiCheckTypes, short>("DuplicateItemLocation", ct),
                    EntityTypeId = await _lookups.IdAsync<Domain.Entities.EntityTypes, short>("PurchaseRequisition", ct),
                    EntityId = pr.Id,
                    Outcome = "Block",
                    CheckedAt = DateTime.UtcNow,
                });
                await _db.SaveChangesAsync(ct);
                throw new InvalidOperationException($"Item {line.ItemId} already has an open PR at this location.");
            }
        }

        var policyVersionId = pr.PolicyVersionId ?? await _db.PolicyVersions.OrderByDescending(p => p.Id).Select(p => p.Id).FirstAsync(ct);
        var subHead = await _db.SpendSubHeads.FirstAsync(s => s.Id == pr.SpendSubHeadId, ct);

        var pendingHod = await _lookups.IdAsync<PrStatuses, short>("PendingHod", ct);

        if (wasReturned && pr.WorkflowInstanceId.HasValue)
        {
            var definitionId = await _db.WorkflowInstances.Where(i => i.Id == pr.WorkflowInstanceId.Value).Select(i => i.DefinitionId).FirstAsync(ct);
            var resumed = await _workflow.ResumeAsync(pr.WorkflowInstanceId.Value, request.ActorUserId, ct);
            pr.PrStatusId = await ResolveStatusForStageAsync(definitionId, resumed.CurrentStageCode, ct);
            pr.UpdatedBy = request.ActorUserId;
            pr.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return new SubmitPrResult((await _db.PrStatuses.FindAsync(new object[] { pr.PrStatusId }, ct))!.Code, resumed.NextRole);
        }

        var definition = await _db.WorkflowDefinitions.FirstAsync(d => d.Id == subHead.WorkflowDefinitionId, ct);
        var requesterRoleId = await _lookups.IdAsync<Roles, long>("REQUESTOR", ct);
        var start = await _workflow.StartAsync(new StartWorkflowRequest(
            definition.Code, pr.Id, request.ActorUserId, requesterRoleId, policyVersionId,
            pr.EstimatedAmount, subHead.Id, pr.DepartmentId, pr.RequesterId), ct);

        pr.WorkflowInstanceId = start.InstanceId;
        pr.PrStatusId = await ResolveStatusForStageAsync(definition.Id, start.CurrentStageCode, ct, fallback: pendingHod);
        pr.SubmittedAt = DateTime.UtcNow;
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var statusCode = (await _db.PrStatuses.FindAsync(new object[] { pr.PrStatusId }, ct))!.Code;
        return new SubmitPrResult(statusCode, start.NextRole);
    }

    // Maps a workflow stage code (scoped to its definition, since several definitions reuse
    // stage codes like "APPROVE_HOD") to the PR status the business-facing lookup table
    // expects - WorkflowStages.PrStatusId already carries this; this just reads it back.
    private async Task<short> ResolveStatusForStageAsync(long definitionId, string? stageCode, CancellationToken ct, short? fallback = null)
    {
        if (stageCode is null) return fallback ?? await _lookups.IdAsync<PrStatuses, short>("Closed", ct);
        var stage = await _db.WorkflowStages.FirstOrDefaultAsync(s => s.DefinitionId == definitionId && s.StageCode == stageCode, ct);
        return stage?.PrStatusId ?? fallback ?? await _lookups.IdAsync<PrStatuses, short>("PendingHod", ct);
    }
}
