using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Requisitions;

// One handler for every approval-stage move (Approve/Return/Reject/Query), driven entirely by
// IWorkflowEngine so the sequence, the "never skip a required approver" guarantee and the
// self-approval/dual-stage checks all come from the single engine tested in
// Procurement.Application.Tests/Workflow. The caller (API layer) supplies which role the actor
// is acting as - which endpoint they hit (HOD/Finance/Audit/OPD) implies the role.
public record ActPrCommand(long ActorUserId, long PrId, string RoleCode, string ActionCode, string? Remarks) : IRequest<SubmitPrResult>;

public class ActPrHandler : IRequestHandler<ActPrCommand, SubmitPrResult>
{
    // This endpoint is for Approval/Review/Exception-stage decisions only - exactly the
    // actions WorkflowEngine.GetAllowedActionsAsync offers for those stage types. Every
    // Operational/Closure stage (PROCUREMENT_ACCEPT, GRN, BILL_FORWARD, AUDIT_STAMP, ...) has
    // its own dedicated command that runs the stage's real business logic (e.g. AuditStamp's
    // paid+delivered check, BR-043) before it calls IWorkflowEngine.ExecuteAsync itself with
    // Complete. Accepting ActionCode=Complete (or Void/Cancel/Skip/...) here would let a
    // caller walk straight past that logic and close the stage for free, so it is refused.
    private static readonly HashSet<string> AllowedGenericActions = new(StringComparer.OrdinalIgnoreCase)
    {
        WorkflowActionCode.Approve, WorkflowActionCode.Return, WorkflowActionCode.Reject,
        WorkflowActionCode.Query, WorkflowActionCode.Refer,
    };

    private readonly IApplicationDbContext _db;
    private readonly IWorkflowEngine _workflow;
    private readonly IPermissionChecker _permissions;
    private readonly UserAccessService _access;
    private readonly LookupCache _lookups;
    private readonly IDocumentNumberGenerator _numbers;

    public ActPrHandler(IApplicationDbContext db, IWorkflowEngine workflow, IPermissionChecker permissions, UserAccessService access, LookupCache lookups, IDocumentNumberGenerator numbers)
    {
        _db = db;
        _workflow = workflow;
        _permissions = permissions;
        _access = access;
        _lookups = lookups;
        _numbers = numbers;
    }

    public async Task<SubmitPrResult> Handle(ActPrCommand request, CancellationToken ct)
    {
        if (!AllowedGenericActions.Contains(request.ActionCode))
            throw new InvalidOperationException(
                $"'{request.ActionCode}' is not a generic approval action. This stage has its own dedicated endpoint.");

        await _permissions.RequireAsync(request.ActorUserId, request.ActionCode == WorkflowActionCode.Refer ? "PR.REFER" : "PR.APPROVE", ct);

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        if (pr.WorkflowInstanceId is null) throw new InvalidOperationException("This PR has not been submitted.");

        var roleId = await _lookups.IdAsync<Roles, long>(request.RoleCode, ct);
        var hasRole = await _access.HasRoleAsync(request.ActorUserId, request.RoleCode, null, ct);
        if (!hasRole) throw new UnauthorizedAccessException($"User does not hold the {request.RoleCode} role.");

        var definitionId = await _db.WorkflowInstances.Where(i => i.Id == pr.WorkflowInstanceId.Value).Select(i => i.DefinitionId).FirstAsync(ct);

        var result = await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
            pr.WorkflowInstanceId.Value, request.ActorUserId, roleId, request.ActionCode,
            pr.RequesterId, pr.DepartmentId, request.Remarks, pr.EstimatedAmount), ct);

        pr.PrStatusId = result.Rejected
            ? await _lookups.IdAsync<PrStatuses, short>("Rejected", ct)
            : request.ActionCode == WorkflowActionCode.Return
                ? await _lookups.IdAsync<PrStatuses, short>("Returned", ct)
                : request.ActionCode == WorkflowActionCode.Query
                    ? await _lookups.IdAsync<PrStatuses, short>("Queried", ct)
                    : await ResolveStatusAsync(definitionId, result.CurrentStageCode, ct);

        if (result.Completed && !result.Rejected) pr.ClosedAt = DateTime.UtcNow;

        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        // Bill / On-Usage / As-Policy route (BR-045): there is no Procurement step, so once
        // Finance's final approval lands the PR on AUDIT_STAMP, forwarding to the Finance
        // Portal happens automatically here instead of through BillsController.
        if (!result.Rejected && result.CurrentStageCode == "AUDIT_STAMP")
            await AutoForwardBillRouteAsync(pr, request.ActorUserId, ct);

        var statusCode = (await _db.PrStatuses.FindAsync(new object[] { pr.PrStatusId }, ct))!.Code;
        return new SubmitPrResult(statusCode, result.NextRole);
    }

    private async Task AutoForwardBillRouteAsync(PurchaseRequisitions pr, long actorUserId, CancellationToken ct)
    {
        var prBill = await _db.Set<PrBills>().FirstOrDefaultAsync(b => b.PrId == pr.Id, ct);
        if (prBill is null) return; // purchase-cycle PR; Procurement forwards its own bill separately
        if (await _db.Set<SupplierInvoices>().AnyAsync(i => i.PrId == pr.Id, ct)) return; // already forwarded

        var invoice = new SupplierInvoices
        {
            InvoiceNo = await _numbers.NextAsync(DocumentSequence.Inv, ct),
            VendorId = prBill.PayeeVendorId ?? throw new InvalidOperationException("This bill has no payee vendor recorded."),
            VendorInvoiceRef = pr.PrNumber,
            VendorRefNormalized = pr.PrNumber,
            PrId = pr.Id,
            PoId = null,
            InvoiceDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CurrencyCode = "PKR",
            Total = prBill.BillAmount,
            DocumentId = prBill.BillDocumentId,
            UploadedBy = actorUserId,
            ForwardedToFinanceAt = DateTime.UtcNow,
            ForwardedBy = actorUserId,
            BillStatus = "Forwarded",
            FinancePortalRef = $"FP-{pr.PrNumber}",
            CreatedBy = actorUserId,
        };
        _db.Set<SupplierInvoices>().Add(invoice);
        _db.Set<OutboxMessages>().Add(new OutboxMessages
        {
            MessageType = "FinancePortal.BillForwarded",
            Payload = System.Text.Json.JsonSerializer.Serialize(new { invoice.PrId, invoice.VendorId, invoice.Total, invoice.FinancePortalRef }),
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
    }

    private async Task<short> ResolveStatusAsync(long definitionId, string? stageCode, CancellationToken ct)
    {
        if (stageCode is null) return await _lookups.IdAsync<PrStatuses, short>("Closed", ct);
        var stage = await _db.WorkflowStages.FirstOrDefaultAsync(s => s.DefinitionId == definitionId && s.StageCode == stageCode, ct);
        return stage?.PrStatusId ?? await _lookups.IdAsync<PrStatuses, short>("PendingProcurement", ct);
    }
}

// BR-048: OPD can force-revert or void a PR with a reason; nothing is deleted, the full
// history stays in WorkflowActions/AuditEvents.
public record ForceRevertPrCommand(long ActorUserId, long PrId, string Reason) : IRequest;
public record VoidPrCommand(long ActorUserId, long PrId, string Reason) : IRequest;

public class ForceRevertPrHandler : IRequestHandler<ForceRevertPrCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IWorkflowEngine _workflow;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;

    public ForceRevertPrHandler(IApplicationDbContext db, IWorkflowEngine workflow, IPermissionChecker permissions, LookupCache lookups)
    {
        _db = db;
        _workflow = workflow;
        _permissions = permissions;
        _lookups = lookups;
    }

    public async Task Handle(ForceRevertPrCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "PR.FORCE_REVERT", ct);
        if (string.IsNullOrWhiteSpace(request.Reason)) throw new InvalidOperationException("A reason is required.");

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        var opdRoleId = await _lookups.IdAsync<Roles, long>("OPD", ct);

        if (pr.WorkflowInstanceId.HasValue)
        {
            await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
                pr.WorkflowInstanceId.Value, request.ActorUserId, opdRoleId, WorkflowActionCode.ForceRevert,
                pr.RequesterId, pr.DepartmentId, request.Reason, pr.EstimatedAmount), ct);
        }
        pr.PrStatusId = await _lookups.IdAsync<PrStatuses, short>("Returned", ct);
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

public class VoidPrHandler : IRequestHandler<VoidPrCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IWorkflowEngine _workflow;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;

    public VoidPrHandler(IApplicationDbContext db, IWorkflowEngine workflow, IPermissionChecker permissions, LookupCache lookups)
    {
        _db = db;
        _workflow = workflow;
        _permissions = permissions;
        _lookups = lookups;
    }

    public async Task Handle(VoidPrCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "PR.VOID", ct);
        if (string.IsNullOrWhiteSpace(request.Reason)) throw new InvalidOperationException("A reason is required.");

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        var opdRoleId = await _lookups.IdAsync<Roles, long>("OPD", ct);

        if (pr.WorkflowInstanceId.HasValue)
        {
            await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
                pr.WorkflowInstanceId.Value, request.ActorUserId, opdRoleId, WorkflowActionCode.Void,
                pr.RequesterId, pr.DepartmentId, request.Reason, pr.EstimatedAmount), ct);
        }
        pr.PrStatusId = await _lookups.IdAsync<PrStatuses, short>("Cancelled", ct);
        pr.ClosedAt = DateTime.UtcNow;
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
