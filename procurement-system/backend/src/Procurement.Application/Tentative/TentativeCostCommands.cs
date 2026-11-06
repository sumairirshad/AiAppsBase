using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Policy;
using Procurement.Application.Purchasing;
using Procurement.Domain.Entities;

namespace Procurement.Application.Tentative;

// BR-047: a Fault/Project PR can start on an estimate. Procurement issues a manual PO so work
// can begin; once the final cost is known, the variance decides who signs off: up to 10%
// Procurement adjusts it directly, 10-50% needs HOD approval, 50%+ sends it back to the
// Requestor for full re-approval on the new amount (handled by a normal resubmission, so it
// goes through the whole value-band chain again rather than a shortcut).
public record CreateManualPoCommand(long ActorUserId, long PrId, long VendorId, decimal EstimatedTotal, string? AdvanceTypeCode, decimal? AdvanceAmount) : IRequest<long>;

public class CreateManualPoHandler : IRequestHandler<CreateManualPoCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;
    private readonly IDocumentNumberGenerator _numbers;

    public CreateManualPoHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups, IDocumentNumberGenerator numbers)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
        _numbers = numbers;
    }

    public async Task<long> Handle(CreateManualPoCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "PO.CREATE", ct);
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        var tentativeCostType = await _lookups.IdAsync<CostTypes, short>("Tentative", ct);
        if (pr.CostTypeId != tentativeCostType) throw new InvalidOperationException("This PR is not flagged Tentative.");

        var manualType = await _lookups.IdAsync<PoTypes, short>("Manual", ct);
        var issuedStatus = await _lookups.IdAsync<PoStatuses, short>("Issued", ct);
        var advanceTypeId = await _lookups.IdAsync<AdvanceTypes, short>(request.AdvanceTypeCode ?? "None", ct);

        var po = new PurchaseOrders
        {
            PoNumber = await _numbers.NextAsync(DocumentSequence.Mpo, ct),
            PoBaseNumber = "MPO",
            PrId = pr.Id,
            VendorId = request.VendorId,
            PoTypeId = manualType,
            PoStatusId = issuedStatus,
            CurrencyCode = "PKR",
            SubTotal = request.EstimatedTotal,
            Total = request.EstimatedTotal,
            DeliveryDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            IdempotencyKey = Guid.NewGuid(),
            IssuedAt = DateTime.UtcNow,
            AdvanceTypeId = advanceTypeId,
            AdvanceAmount = request.AdvanceAmount,
            CreatedBy = request.ActorUserId,
        };
        _db.PurchaseOrders.Add(po);
        await _db.SaveChangesAsync(ct);
        return po.Id;
    }
}

public record FinalCostResult(decimal VariancePct, string Outcome, long? FinalPoId);

// Shared by EnterFinalCostHandler and ApproveTentativeVarianceHandler - a plain service
// (not a MediatR handler) so both can depend on it directly via normal DI.
public class TentativeCostService
{
    private readonly IApplicationDbContext _db;
    private readonly LookupCache _lookups;

    public TentativeCostService(IApplicationDbContext db, LookupCache lookups)
    {
        _db = db;
        _lookups = lookups;
    }

    public async Task<long> ReplaceManualPoAsync(PurchaseRequisitions pr, PurchaseOrders manualPo, decimal finalAmount, long actorUserId, CancellationToken ct)
    {
        var standardType = await _lookups.IdAsync<PoTypes, short>("Standard", ct);
        var closedStatus = await _lookups.IdAsync<PoStatuses, short>("Closed", ct);
        manualPo.PoStatusId = closedStatus;
        manualPo.UpdatedBy = actorUserId;
        manualPo.UpdatedAt = DateTime.UtcNow;

        var finalPo = new PurchaseOrders
        {
            PoNumber = manualPo.PoNumber.Replace("MPO-", "PO-"),
            PoBaseNumber = manualPo.PoNumber.Replace("MPO-", ""),
            PrId = pr.Id,
            VendorId = manualPo.VendorId,
            PoTypeId = standardType,
            PoStatusId = await _lookups.IdAsync<PoStatuses, short>("Active", ct),
            ReplacesPoId = manualPo.Id,
            CurrencyCode = "PKR",
            SubTotal = finalAmount,
            Total = finalAmount,
            DeliveryDate = manualPo.DeliveryDate,
            IdempotencyKey = Guid.NewGuid(),
            IssuedAt = DateTime.UtcNow,
            AdvanceTypeId = manualPo.AdvanceTypeId,
            AdvanceAmount = manualPo.AdvanceAmount,
            AdvancePaid = manualPo.AdvancePaid,
            CreatedBy = actorUserId,
        };
        _db.PurchaseOrders.Add(finalPo);
        await _db.SaveChangesAsync(ct);
        return finalPo.Id;
    }

    public async Task<long> ApproveVarianceAsHodAsync(long prId, long actorUserId, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstAsync(p => p.Id == prId, ct);
        var manualPo = await _db.PurchaseOrders.FirstAsync(p => p.PrId == prId && p.PoBaseNumber == "MPO", ct);
        var finalPoId = await ReplaceManualPoAsync(pr, manualPo, pr.FinalAmount!.Value, actorUserId, ct);
        pr.PrStatusId = await _lookups.IdAsync<PrStatuses, short>("BillPending", ct);
        await _db.SaveChangesAsync(ct);
        return finalPoId;
    }
}

public record EnterFinalCostCommand(long ActorUserId, long PrId, long ManualPoId, decimal FinalAmount) : IRequest<FinalCostResult>;

public class EnterFinalCostHandler : IRequestHandler<EnterFinalCostCommand, FinalCostResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly IPolicySettingsReader _settings;
    private readonly LookupCache _lookups;
    private readonly TentativeCostService _service;

    public EnterFinalCostHandler(IApplicationDbContext db, IPermissionChecker permissions, IPolicySettingsReader settings, LookupCache lookups, TentativeCostService service)
    {
        _db = db;
        _permissions = permissions;
        _settings = settings;
        _lookups = lookups;
        _service = service;
    }

    public async Task<FinalCostResult> Handle(EnterFinalCostCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "PO.CREATE", ct);
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        var manualPo = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == request.ManualPoId && p.PrId == pr.Id, ct)
            ?? throw new InvalidOperationException("Manual PO not found on this PR.");

        var variancePct = Math.Abs(request.FinalAmount - manualPo.Total) / manualPo.Total * 100m;
        pr.TentativeVariancePct = variancePct;
        pr.FinalAmount = request.FinalAmount;

        var policyVersionId = pr.PolicyVersionId ?? 0;
        var minorPct = await _settings.GetDecimalAsync(policyVersionId, "TENTATIVE_MINOR_PCT", 10, ct);
        var majorPct = await _settings.GetDecimalAsync(policyVersionId, "TENTATIVE_MAJOR_PCT", 50, ct);

        if (variancePct <= minorPct)
        {
            var finalPoId = await _service.ReplaceManualPoAsync(pr, manualPo, request.FinalAmount, request.ActorUserId, ct);
            pr.PrStatusId = await _lookups.IdAsync<PrStatuses, short>("BillPending", ct);
            await _db.SaveChangesAsync(ct);
            return new FinalCostResult(variancePct, "ProcurementAdjusted", finalPoId);
        }

        if (variancePct < majorPct)
        {
            pr.PrStatusId = await _lookups.IdAsync<PrStatuses, short>("OnHold", ct);
            await _db.SaveChangesAsync(ct);
            return new FinalCostResult(variancePct, "PendingHodApproval", null);
        }

        // 50%+: back to the requestor on the new estimate - a normal Returned PR, which goes
        // through the full value-band chain again on resubmission.
        pr.EstimatedAmount = request.FinalAmount;
        pr.PrStatusId = await _lookups.IdAsync<PrStatuses, short>("Returned", ct);
        await _db.SaveChangesAsync(ct);
        return new FinalCostResult(variancePct, "ReturnedToRequestor", null);
    }
}

// BR-047: the HOD-approval step for a 10-50% tentative variance.
public record ApproveTentativeVarianceCommand(long ActorUserId, long PrId) : IRequest<long>;

public class ApproveTentativeVarianceHandler : IRequestHandler<ApproveTentativeVarianceCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly UserAccessService _access;
    private readonly TentativeCostService _service;

    public ApproveTentativeVarianceHandler(IApplicationDbContext db, IPermissionChecker permissions, UserAccessService access, TentativeCostService service)
    {
        _db = db;
        _permissions = permissions;
        _access = access;
        _service = service;
    }

    public async Task<long> Handle(ApproveTentativeVarianceCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "PR.APPROVE", ct);
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        if (!await _access.HasRoleAsync(request.ActorUserId, "HOD", pr.DepartmentId, ct))
            throw new UnauthorizedAccessException("Only the department's HOD can approve this variance.");

        return await _service.ApproveVarianceAsHodAsync(pr.Id, request.ActorUserId, ct);
    }
}
