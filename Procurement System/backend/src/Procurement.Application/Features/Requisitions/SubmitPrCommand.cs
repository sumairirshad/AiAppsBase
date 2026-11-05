using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Common.Notify;
using Procurement.Application.Common.Policy;
using Procurement.Application.Workflow;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Requisitions;

public record SubmitPrCommand(long PrId) : IRequest;

public class SubmitPrCommandHandler : IRequestHandler<SubmitPrCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public SubmitPrCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(SubmitPrCommand request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);

        var draftStatus = await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.Draft, ct);
        var returnedStatus = await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.Returned, ct);
        if (pr.PrStatusId != draftStatus.Id && pr.PrStatusId != returnedStatus.Id)
        {
            throw new BusinessRuleException("Only a draft or returned purchase requisition can be submitted.");
        }
        if (pr.RequesterId != _currentUser.UserId && !await _currentUser.HasRoleAsync(RoleCodes.Opd))
        {
            throw new ForbiddenAccessException("Only the requester (or OPD) may submit this purchase requisition.");
        }

        var subHead = await _db.SpendSubHeads.Include(s => s.WorkflowDefinition).FirstAsync(s => s.Id == pr.SpendSubHeadId, ct);
        var policyVersion = await PolicyVersionResolver.GetCurrentAsync(_db, ct);
        var entityType = await _db.EntityTypes.FirstAsync(e => e.Code == EntityTypeCodes.PurchaseRequisition, ct);
        var actorRoleId = await PrGuards.ResolveActorRoleIdAsync(_db, _currentUser, ct);

        var context = new Dictionary<string, object>
        {
            ["Amount"] = pr.EstimatedAmount,
            ["DepartmentId"] = pr.DepartmentId,
            ["RequesterId"] = pr.RequesterId,
        };

        var instance = await _workflowEngine.StartAsync(subHead.WorkflowDefinition.Code, entityType.Id, pr.Id, policyVersion.Id, context, _currentUser.UserId, actorRoleId, ct);

        pr.WorkflowInstanceId = instance.Id;
        pr.PolicyVersionId = policyVersion.Id;
        pr.SubmittedAt = DateTime.UtcNow;
        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = DateTime.UtcNow;

        if (instance.CurrentStageId != null)
        {
            var stage = await _db.WorkflowStages.FirstAsync(s => s.Id == instance.CurrentStageId, ct);
            if (stage.PrStatusId != null) pr.PrStatusId = stage.PrStatusId.Value;

            if (stage.RoleId != null)
            {
                await NotificationWriter.AddAsync(
                    _db, NotificationTypeCodes.ActionRequired, entityType.Id, pr.Id,
                    $"Purchase requisition {pr.PrNumber} is awaiting your action.",
                    $"pr-stage-{instance.Id}-{stage.Id}", ct, roleId: stage.RoleId);
            }
        }

        await _db.SaveChangesAsync(ct);
    }
}
