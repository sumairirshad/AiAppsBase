using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Recurring;

// BR-046: the Cyclic Fixed items plan's "one verification quotation" step - the vendor is
// already pre-agreed on the plan, so this just confirms the price for this period and
// completes PROCUREMENT_VERIFY_QUOTE (an Operational stage owned by Procurement, so it goes
// through here rather than the HOD/Finance/Audit/OPD-only generic Act endpoint).
public record VerifyRecurringQuoteCommand(long ActorUserId, long PrId, decimal VerifiedUnitPrice) : IRequest<SubmitPrResult>;

public class VerifyRecurringQuoteHandler : IRequestHandler<VerifyRecurringQuoteCommand, SubmitPrResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly IWorkflowEngine _workflow;
    private readonly LookupCache _lookups;

    public VerifyRecurringQuoteHandler(IApplicationDbContext db, IPermissionChecker permissions, IWorkflowEngine workflow, LookupCache lookups)
    {
        _db = db;
        _permissions = permissions;
        _workflow = workflow;
        _lookups = lookups;
    }

    public async Task<SubmitPrResult> Handle(VerifyRecurringQuoteCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "SOURCING.QUOTE", ct);
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        if (pr.WorkflowInstanceId is null) throw new InvalidOperationException("This PR has no active workflow instance.");

        foreach (var line in await _db.PrLines.Where(l => l.PrId == pr.Id).ToListAsync(ct))
            line.EstUnitPrice = request.VerifiedUnitPrice;
        pr.EstimatedAmount = (await _db.PrLines.Where(l => l.PrId == pr.Id).ToListAsync(ct)).Sum(l => l.Qty * l.EstUnitPrice);
        await _db.SaveChangesAsync(ct);

        var definitionId = await _db.WorkflowInstances.Where(i => i.Id == pr.WorkflowInstanceId.Value).Select(i => i.DefinitionId).FirstAsync(ct);
        var procurementRoleId = await _lookups.IdAsync<Roles, long>("PROCUREMENT", ct);
        var result = await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
            pr.WorkflowInstanceId.Value, request.ActorUserId, procurementRoleId, WorkflowActionCode.Complete,
            pr.RequesterId, pr.DepartmentId, CurrentAmount: pr.EstimatedAmount), ct);

        var statusId = result.CurrentStageCode is null
            ? await _lookups.IdAsync<PrStatuses, short>("Closed", ct)
            : (await _db.WorkflowStages.FirstOrDefaultAsync(s => s.DefinitionId == definitionId && s.StageCode == result.CurrentStageCode, ct))?.PrStatusId
              ?? await _lookups.IdAsync<PrStatuses, short>("PendingAudit", ct);
        pr.PrStatusId = statusId;
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new SubmitPrResult((await _db.PrStatuses.FindAsync(new object[] { statusId }, ct))!.Code, result.NextRole);
    }
}
