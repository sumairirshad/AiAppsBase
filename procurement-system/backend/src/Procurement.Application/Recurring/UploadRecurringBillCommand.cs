using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Recurring;

// BR-046: the Cyclic Fixed "bill" plan's OWNER_UPLOAD stage - RecurringOccurrenceGenerator
// creates the period's PR and starts WF_CYCLIC_BILL automatically, but the plan owner still
// has to tell the system what this period's actual bill is (period, amount, due date,
// document) before it can go to HOD/Audit/Finance - without this handler there was no way to
// complete that stage at all.
public record UploadRecurringBillCommand(long ActorUserId, long PrId, PrBillInput Bill) : IRequest<SubmitPrResult>;

public class UploadRecurringBillHandler : IRequestHandler<UploadRecurringBillCommand, SubmitPrResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly IWorkflowEngine _workflow;
    private readonly LookupCache _lookups;

    public UploadRecurringBillHandler(IApplicationDbContext db, IPermissionChecker permissions, IWorkflowEngine workflow, LookupCache lookups)
    {
        _db = db;
        _permissions = permissions;
        _workflow = workflow;
        _lookups = lookups;
    }

    public async Task<SubmitPrResult> Handle(UploadRecurringBillCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "PR.BILL_UPLOAD", ct);
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        if (pr.WorkflowInstanceId is null) throw new InvalidOperationException("This PR has no active workflow instance.");
        if (await _db.Set<PrBills>().AnyAsync(b => b.PrId == pr.Id, ct))
            throw new InvalidOperationException("A bill has already been uploaded for this period.");

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
        pr.EstimatedAmount = request.Bill.BillAmount;
        await _db.SaveChangesAsync(ct);

        var definitionId = await _db.WorkflowInstances.Where(i => i.Id == pr.WorkflowInstanceId.Value).Select(i => i.DefinitionId).FirstAsync(ct);
        var requestorRoleId = await _lookups.IdAsync<Roles, long>("REQUESTOR", ct);
        var result = await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
            pr.WorkflowInstanceId.Value, request.ActorUserId, requestorRoleId, WorkflowActionCode.Complete,
            pr.RequesterId, pr.DepartmentId, CurrentAmount: pr.EstimatedAmount), ct);

        var statusId = result.CurrentStageCode is null
            ? await _lookups.IdAsync<PrStatuses, short>("Closed", ct)
            : (await _db.WorkflowStages.FirstOrDefaultAsync(s => s.DefinitionId == definitionId && s.StageCode == result.CurrentStageCode, ct))?.PrStatusId
              ?? await _lookups.IdAsync<PrStatuses, short>("PendingHod", ct);
        pr.PrStatusId = statusId;
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new SubmitPrResult((await _db.PrStatuses.FindAsync(new object[] { statusId }, ct))!.Code, result.NextRole);
    }
}
