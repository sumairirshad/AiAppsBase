using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Common.Notify;
using Procurement.Application.Workflow;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Requisitions;

internal static class PrWorkflowResultApplier
{
    public static async Task ApplyAsync(IProcurementDbContext db, PurchaseRequisitions pr, WorkflowAdvanceResult result, CancellationToken ct)
    {
        var entityType = await db.EntityTypes.FirstAsync(e => e.Code == EntityTypeCodes.PurchaseRequisition, ct);

        if (result.IsCompleted || result.NewStage == null)
        {
            var closedStatus = await db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.Closed, ct);
            pr.PrStatusId = closedStatus.Id;
            pr.ClosedAt = DateTime.UtcNow;
            return;
        }

        if (result.NewStage.PrStatusId != null)
        {
            pr.PrStatusId = result.NewStage.PrStatusId.Value;
        }

        if (result.NewStage.RoleId != null)
        {
            await NotificationWriter.AddAsync(
                db, NotificationTypeCodes.ActionRequired, entityType.Id, pr.Id,
                $"Purchase requisition {pr.PrNumber} is awaiting your action.",
                $"pr-stage-{pr.WorkflowInstanceId}-{result.NewStage.Id}", ct, roleId: result.NewStage.RoleId);
        }
    }
}

public record ApprovePrCommand(long PrId, string? Remarks) : IRequest;

public class ApprovePrCommandHandler : IRequestHandler<ApprovePrCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public ApprovePrCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(ApprovePrCommand request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);

        var (task, _) = await ResolveTaskAnyApprovalRoleAsync(pr, ct);
        var role = await _db.Roles.FirstAsync(r => r.Id == task.AssignedRoleId, ct);

        var context = new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount };
        var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Approve, _currentUser.UserId, role.Id, request.Remarks, context, ct);

        if (role.Code == RoleCodes.Audit || (role.Code == RoleCodes.Finance))
        {
            pr.ApprovedAmount = pr.EstimatedAmount;
        }
        else if (role.Code == RoleCodes.Hod && pr.ApprovedAmount == null)
        {
            pr.ApprovedAmount = pr.EstimatedAmount;
        }

        await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);
        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    private async Task<(WorkflowTasks Task, long RoleId)> ResolveTaskAnyApprovalRoleAsync(PurchaseRequisitions pr, CancellationToken ct)
    {
        foreach (var roleCode in new[] { RoleCodes.Hod, RoleCodes.Finance, RoleCodes.Audit })
        {
            try
            {
                return await PrGuards.EnsureCanActOnTaskAsync(_db, _currentUser, _workflowEngine, pr, roleCode, ct);
            }
            catch (ForbiddenAccessException)
            {
            }
        }
        throw new ForbiddenAccessException("You do not hold the role required for the current stage of this purchase requisition.");
    }
}

public record RejectPrCommand(long PrId, string Reason) : IRequest;

public class RejectPrCommandHandler : IRequestHandler<RejectPrCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public RejectPrCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(RejectPrCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new BusinessRuleException("A reason is required to reject a purchase requisition.");
        }

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        if (pr.RequesterId == _currentUser.UserId)
        {
            throw new ForbiddenAccessException("The requester may not act on their own purchase requisition.");
        }

        var task = await _workflowEngine.GetOpenTaskAsync(pr.WorkflowInstanceId!.Value, ct)
            ?? throw new BusinessRuleException("There is no open task to act on.");
        var role = await _db.Roles.FirstAsync(r => r.Id == task.AssignedRoleId, ct);

        await _workflowEngine.TerminateAsync(pr.WorkflowInstanceId.Value, ActionTypeCodes.Reject, _currentUser.UserId, role.Id, request.Reason, ct);

        var rejectedStatus = await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.Rejected, ct);
        pr.PrStatusId = rejectedStatus.Id;
        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = DateTime.UtcNow;

        var entityType = await _db.EntityTypes.FirstAsync(e => e.Code == EntityTypeCodes.PurchaseRequisition, ct);
        await NotificationWriter.AddAsync(
            _db, NotificationTypeCodes.ActionRequired, entityType.Id, pr.Id,
            $"Purchase requisition {pr.PrNumber} was rejected: {request.Reason}",
            $"pr-rejected-{pr.Id}", ct, userId: pr.RequesterId);

        await _db.SaveChangesAsync(ct);
    }
}

public record ReturnPrCommand(long PrId, string Reason) : IRequest;

public class ReturnPrCommandHandler : IRequestHandler<ReturnPrCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public ReturnPrCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(ReturnPrCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new BusinessRuleException("A reason is required to return a purchase requisition.");
        }

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        if (pr.RequesterId == _currentUser.UserId)
        {
            throw new ForbiddenAccessException("The requester may not act on their own purchase requisition.");
        }

        var task = await _workflowEngine.GetOpenTaskAsync(pr.WorkflowInstanceId!.Value, ct)
            ?? throw new BusinessRuleException("There is no open task to act on.");
        var role = await _db.Roles.FirstAsync(r => r.Id == task.AssignedRoleId, ct);

        await _workflowEngine.TerminateAsync(pr.WorkflowInstanceId.Value, ActionTypeCodes.Return, _currentUser.UserId, role.Id, request.Reason, ct);

        var returnedStatus = await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.Returned, ct);
        pr.PrStatusId = returnedStatus.Id;
        pr.WorkflowInstanceId = null;
        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = DateTime.UtcNow;

        var entityType = await _db.EntityTypes.FirstAsync(e => e.Code == EntityTypeCodes.PurchaseRequisition, ct);
        await NotificationWriter.AddAsync(
            _db, NotificationTypeCodes.ActionRequired, entityType.Id, pr.Id,
            $"Purchase requisition {pr.PrNumber} was returned for correction: {request.Reason}",
            $"pr-returned-{pr.Id}-{DateTime.UtcNow.Ticks}", ct, userId: pr.RequesterId);

        await _db.SaveChangesAsync(ct);
    }
}
