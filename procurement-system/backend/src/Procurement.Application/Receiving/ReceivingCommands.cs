using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Requisitions;
using Procurement.Application.Vendoring;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Receiving;

public record GrnLineInput(long PoLineId, decimal DeliveredQty, decimal AcceptedQty, decimal RejectedQty, string? RejectReason);

// BR-039: delivery note number mandatory, partial receipts allowed, never an over-receipt
// (accepted+rejected <= delivered <= outstanding on the PO line).
public record RecordGrnCommand(long ActorUserId, long PoId, string DeliveryNoteNo, DateOnly ReceivedOn, List<GrnLineInput> Lines) : IRequest<SubmitPrResult?>;

public class RecordGrnHandler : IRequestHandler<RecordGrnCommand, SubmitPrResult?>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;
    private readonly IWorkflowEngine _workflow;
    private readonly IDocumentNumberGenerator _numbers;

    public RecordGrnHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups, IWorkflowEngine workflow, IDocumentNumberGenerator numbers)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
        _workflow = workflow;
        _numbers = numbers;
    }

    public async Task<SubmitPrResult?> Handle(RecordGrnCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.DeliveryNoteNo)) throw new InvalidOperationException("The delivery note number is mandatory.");

        var po = await _db.PurchaseOrders.FirstOrDefaultAsync(p => p.Id == request.PoId, ct)
            ?? throw new InvalidOperationException("PO not found.");

        // BR-008: GRN.RECORD is PROCUREMENT-only role-wide, but the GRN stage escalates to
        // OPD on timeout - pass the owning PR's workflow instance so a genuine escalation
        // target is accepted too, not just whoever holds GRN.RECORD.
        var grnWorkflowInstanceId = await _db.PurchaseRequisitions.Where(p => p.Id == po.PrId).Select(p => p.WorkflowInstanceId).FirstAsync(ct);
        await _permissions.RequireAsync(request.ActorUserId, "GRN.RECORD", grnWorkflowInstanceId, ct);

        var poLines = await _db.Set<PoLines>().Where(l => l.PoId == po.Id).ToDictionaryAsync(l => l.Id, ct);

        foreach (var line in request.Lines)
        {
            var poLine = poLines.GetValueOrDefault(line.PoLineId) ?? throw new InvalidOperationException($"PO line {line.PoLineId} not found on this PO.");
            if (line.AcceptedQty + line.RejectedQty > line.DeliveredQty)
                throw new InvalidOperationException("Accepted + rejected quantity cannot exceed delivered quantity.");
            if (line.AcceptedQty > poLine.OutstandingQty)
                throw new InvalidOperationException($"Accepted quantity for PO line {line.PoLineId} exceeds the outstanding quantity - over-receipt is blocked.");
        }

        var grn = new GoodsReceipts
        {
            GrnNumber = await _numbers.NextAsync(DocumentSequence.Grn, ct),
            PoId = po.Id,
            ReceivedOn = request.ReceivedOn,
            DeliveryNoteNo = request.DeliveryNoteNo,
            ReceivedBy = request.ActorUserId,
            OnTime = request.ReceivedOn <= po.DeliveryDate,
            IsLate = request.ReceivedOn > po.DeliveryDate,
            CreatedBy = request.ActorUserId,
        };
        _db.Set<GoodsReceipts>().Add(grn);
        await _db.SaveChangesAsync(ct);

        foreach (var line in request.Lines)
        {
            _db.Set<GoodsReceiptLines>().Add(new GoodsReceiptLines
            {
                GrnId = grn.Id,
                PoLineId = line.PoLineId,
                DeliveredQty = line.DeliveredQty,
                AcceptedQty = line.AcceptedQty,
                RejectedQty = line.RejectedQty,
                RejectReason = line.RejectReason,
            });
            var poLine = poLines[line.PoLineId];
            poLine.AcceptedQty += line.AcceptedQty;

            var prLine = await _db.PrLines.FirstOrDefaultAsync(l => l.Id == poLine.PrLineId, ct);
            if (prLine is not null) prLine.AcceptedQty += line.AcceptedQty;
        }
        await _db.SaveChangesAsync(ct);

        var receivedStatus = await _lookups.IdAsync<PoStatuses, short>("Received", ct);
        var partialStatus = await _lookups.IdAsync<PoStatuses, short>("PartiallyReceived", ct);
        var refreshedLines = await _db.Set<PoLines>().Where(l => l.PoId == po.Id).ToListAsync(ct);
        po.PoStatusId = refreshedLines.All(l => l.OutstandingQty <= 0) ? receivedStatus : partialStatus;
        po.UpdatedBy = request.ActorUserId;
        po.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        // BR-009/010: a PO can close while the PR stays open - the PR only advances to
        // acknowledgement once every PO on it is fully received.
        var allPos = await _db.PurchaseOrders.Where(p => p.PrId == po.PrId).ToListAsync(ct);
        if (allPos.Any(p => p.PoStatusId != receivedStatus)) return null;

        var pr = await _db.PurchaseRequisitions.FirstAsync(p => p.Id == po.PrId, ct);
        if (pr.WorkflowInstanceId is null) return null;
        var definitionId = await _db.WorkflowInstances.Where(i => i.Id == pr.WorkflowInstanceId.Value).Select(i => i.DefinitionId).FirstAsync(ct);
        var procurementRoleId = await _lookups.IdAsync<Roles, long>("PROCUREMENT", ct);

        var result = await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
            pr.WorkflowInstanceId.Value, request.ActorUserId, procurementRoleId, WorkflowActionCode.Complete,
            pr.RequesterId, pr.DepartmentId, CurrentAmount: pr.EstimatedAmount), ct);

        var statusId = result.CurrentStageCode is null
            ? await _lookups.IdAsync<PrStatuses, short>("Closed", ct)
            : (await _db.WorkflowStages.FirstOrDefaultAsync(s => s.DefinitionId == definitionId && s.StageCode == result.CurrentStageCode, ct))?.PrStatusId
              ?? await _lookups.IdAsync<PrStatuses, short>("AwaitingAcknowledgement", ct);
        pr.PrStatusId = statusId;
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new SubmitPrResult((await _db.PrStatuses.FindAsync(new object[] { statusId }, ct))!.Code, result.NextRole);
    }
}

// BR-012: the requestor acknowledges delivery and rates the vendor's quality (1-5), which
// feeds the vendor score; a dispute returns the PR to Procurement with a reason instead of
// advancing to billing.
public record AcknowledgeDeliveryCommand(long ActorUserId, long PrId, bool Accepted, byte? QualityRating, string? Remarks, string? DisputeReason) : IRequest<SubmitPrResult>;

public class AcknowledgeDeliveryHandler : IRequestHandler<AcknowledgeDeliveryCommand, SubmitPrResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;
    private readonly IWorkflowEngine _workflow;
    private readonly VendorScoreService _scores;
    private readonly UserAccessService _access;

    public AcknowledgeDeliveryHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups, IWorkflowEngine workflow, VendorScoreService scores, UserAccessService access)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
        _workflow = workflow;
        _scores = scores;
        _access = access;
    }

    public async Task<SubmitPrResult> Handle(AcknowledgeDeliveryCommand request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        await _permissions.RequireAsync(request.ActorUserId, "PR.ACKNOWLEDGE", pr.WorkflowInstanceId, ct);

        // ACKNOWLEDGE is Requester-scoped, but (BR-008) escalates to OPD on timeout. The
        // engine call below must be made AS the role that is actually authorized to act -
        // normally REQUESTOR, but the open task's own EscalatedToRoleId once a genuine
        // escalation target (not the requester) is acting, so IWorkflowEngine.AuthorizeAsync
        // recognizes them as the escalation target rather than silently (and wrongly)
        // claiming they are the requester.
        long actingRoleId = await _lookups.IdAsync<Roles, long>("REQUESTOR", ct);
        if (pr.RequesterId != request.ActorUserId)
        {
            if (pr.WorkflowInstanceId is null) throw new UnauthorizedAccessException("Only the requester can acknowledge delivery.");
            var roleIds = (await _access.GetAssignmentsAsync(request.ActorUserId, ct)).Select(a => a.RoleId).ToList();
            if (!await _workflow.CanActNowAsync(pr.WorkflowInstanceId.Value, request.ActorUserId, roleIds, ct))
                throw new UnauthorizedAccessException("Only the requester can acknowledge delivery.");
            var openTask = await _db.WorkflowTasks.Where(t => t.InstanceId == pr.WorkflowInstanceId.Value).OrderByDescending(t => t.Id).FirstAsync(ct);
            actingRoleId = openTask.EscalatedToRoleId
                ?? throw new UnauthorizedAccessException("Only the requester can acknowledge delivery.");
        }
        if (!request.Accepted && string.IsNullOrWhiteSpace(request.DisputeReason))
            throw new InvalidOperationException("A reason is required to dispute delivery.");

        var pos = await _db.PurchaseOrders.Where(p => p.PrId == pr.Id).ToListAsync(ct);
        foreach (var po in pos)
        {
            var grns = await _db.Set<GoodsReceipts>().Where(g => g.PoId == po.Id).ToListAsync(ct);
            foreach (var grn in grns)
            {
                grn.AckStatus = request.Accepted ? "Accepted" : "Disputed";
                grn.AckRemarks = request.Remarks;
                grn.AcknowledgedBy = request.ActorUserId;
                grn.AcknowledgedAt = DateTime.UtcNow;
                if (request.QualityRating.HasValue) grn.QualityRating = request.QualityRating;
                if (!request.Accepted) grn.DisputeReason = request.DisputeReason;
            }
            await _scores.RecalculateAsync(po.VendorId, ct);
        }
        await _db.SaveChangesAsync(ct);

        if (pr.WorkflowInstanceId is null) throw new InvalidOperationException("This PR has no active workflow instance.");
        var definitionId = await _db.WorkflowInstances.Where(i => i.Id == pr.WorkflowInstanceId.Value).Select(i => i.DefinitionId).FirstAsync(ct);

        if (!request.Accepted)
        {
            // Dispute: send it back to Procurement's GRN stage specifically, rather than the
            // generic "pause and resume at the same stage" Return semantics, since the fix
            // happens one stage earlier than where the requester is standing.
            await DivertToGrnStageAsync(pr, definitionId, request.DisputeReason!, ct);
            return new SubmitPrResult("PoIssued", "PROCUREMENT");
        }

        var result = await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
            pr.WorkflowInstanceId.Value, request.ActorUserId, actingRoleId, WorkflowActionCode.Approve,
            pr.RequesterId, pr.DepartmentId, CurrentAmount: pr.EstimatedAmount), ct);

        var statusId = result.CurrentStageCode is null
            ? await _lookups.IdAsync<PrStatuses, short>("Closed", ct)
            : (await _db.WorkflowStages.FirstOrDefaultAsync(s => s.DefinitionId == definitionId && s.StageCode == result.CurrentStageCode, ct))?.PrStatusId
              ?? await _lookups.IdAsync<PrStatuses, short>("BillPending", ct);
        pr.PrStatusId = statusId;
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new SubmitPrResult((await _db.PrStatuses.FindAsync(new object[] { statusId }, ct))!.Code, result.NextRole);
    }

    private async Task DivertToGrnStageAsync(PurchaseRequisitions pr, long definitionId, string reason, CancellationToken ct)
    {
        var ackTask = await _db.WorkflowTasks.Where(t => t.InstanceId == pr.WorkflowInstanceId!.Value).OrderByDescending(t => t.Id).FirstAsync(ct);
        var openStatusId = await _lookups.IdAsync<TaskStatuses, short>("Open", ct);
        var completedStatusId = await _lookups.IdAsync<TaskStatuses, short>("Completed", ct);
        var returnActionId = await _lookups.IdAsync<ActionTypes, short>(WorkflowActionCode.Return, ct);
        var procurementRoleId = await _lookups.IdAsync<Roles, long>("PROCUREMENT", ct);
        var grnStage = await _db.WorkflowStages.FirstAsync(s => s.DefinitionId == definitionId && s.StageCode == "GRN", ct);

        ackTask.TaskStatusId = completedStatusId;
        ackTask.CompletedAt = DateTime.UtcNow;

        var instance = await _db.WorkflowInstances.FirstAsync(i => i.Id == pr.WorkflowInstanceId!.Value, ct);
        _db.Set<WorkflowActions>().Add(new WorkflowActions
        {
            InstanceId = instance.Id,
            TaskId = ackTask.Id,
            ActionTypeId = returnActionId,
            ActorUserId = pr.RequesterId,
            ActorRoleId = await _lookups.IdAsync<Roles, long>("REQUESTOR", ct),
            FromStageId = instance.CurrentStageId,
            ToStageId = grnStage.Id,
            Remarks = reason,
            PolicyVersionId = instance.PolicyVersionId,
            CorrelationId = Guid.NewGuid(),
            ActedAt = DateTime.UtcNow,
        });

        _db.WorkflowTasks.Add(new WorkflowTasks
        {
            InstanceId = instance.Id,
            StageId = grnStage.Id,
            AssignedRoleId = procurementRoleId,
            TaskStatusId = openStatusId,
            CreatedBy = pr.RequesterId,
        });
        instance.CurrentStageId = grnStage.Id;

        pr.PrStatusId = grnStage.PrStatusId ?? pr.PrStatusId;
        pr.UpdatedBy = pr.RequesterId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
