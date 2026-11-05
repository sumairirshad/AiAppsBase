using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Common.Notify;
using Procurement.Application.Workflow;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Requisitions;

public record FinanceApprovePrCommand(long PrId, string BudgetRef, decimal AvailableAmount, string? Remarks) : IRequest;

public class FinanceApprovePrCommandHandler : IRequestHandler<FinanceApprovePrCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public FinanceApprovePrCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(FinanceApprovePrCommand request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        var (_, roleId) = await PrGuards.EnsureCanActOnTaskAsync(_db, _currentUser, _workflowEngine, pr, RoleCodes.Finance, ct);

        var isWithinBudget = pr.EstimatedAmount <= request.AvailableAmount;
        var overBudgetAmount = isWithinBudget ? 0 : pr.EstimatedAmount - request.AvailableAmount;
        var now = DateTime.UtcNow;

        _db.PrBudgetChecks.Add(new PrBudgetChecks
        {
            PrId = pr.Id,
            BudgetRef = request.BudgetRef,
            AvailableAmount = request.AvailableAmount,
            PrAmount = pr.EstimatedAmount,
            IsWithinBudget = isWithinBudget,
            Source = "Manual",
            CheckedBy = _currentUser.UserId,
            CheckedAt = now,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        });

        var context = new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount, ["OverBudget"] = overBudgetAmount };
        var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Approve, _currentUser.UserId, roleId, request.Remarks, context, ct);

        pr.ApprovedAmount = pr.EstimatedAmount;
        await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);
        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = now;

        if (!isWithinBudget)
        {
            var entityType = await _db.EntityTypes.FirstAsync(e => e.Code == EntityTypeCodes.PurchaseRequisition, ct);
            await NotificationWriter.AddAsync(
                _db, NotificationTypeCodes.ActionRequired, entityType.Id, pr.Id,
                $"Purchase requisition {pr.PrNumber} is over budget by {overBudgetAmount:N2}.",
                $"pr-overbudget-{pr.Id}", ct, roleId: (await _db.Roles.FirstAsync(r => r.Code == RoleCodes.Opd, ct)).Id);
        }

        await _db.SaveChangesAsync(ct);
    }
}

public record OpdBudgetExceptionDecisionCommand(long PrId, bool Approve, string Reason) : IRequest;

public class OpdBudgetExceptionDecisionCommandHandler : IRequestHandler<OpdBudgetExceptionDecisionCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public OpdBudgetExceptionDecisionCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(OpdBudgetExceptionDecisionCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new BusinessRuleException("A reason is required for this decision.");
        }

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        var (_, roleId) = await PrGuards.EnsureCanActOnTaskAsync(_db, _currentUser, _workflowEngine, pr, RoleCodes.Opd, ct);

        var budgetCheck = await _db.PrBudgetChecks.Where(b => b.PrId == pr.Id).OrderByDescending(b => b.Id).FirstAsync(ct);
        budgetCheck.OpdDecisionBy = _currentUser.UserId;
        budgetCheck.OpdReason = request.Reason;
        budgetCheck.UpdatedByUserId = _currentUser.UserId;
        budgetCheck.UpdatedAt = DateTime.UtcNow;

        if (request.Approve)
        {
            var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Approve, _currentUser.UserId, roleId, request.Reason, new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount }, ct);
            await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);
        }
        else
        {
            await _workflowEngine.TerminateAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Reject, _currentUser.UserId, roleId, request.Reason, ct);
            var rejectedStatus = await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.Rejected, ct);
            pr.PrStatusId = rejectedStatus.Id;
        }

        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
