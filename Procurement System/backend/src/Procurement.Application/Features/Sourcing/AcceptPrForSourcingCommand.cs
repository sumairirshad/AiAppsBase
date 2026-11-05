using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Common.Policy;
using Procurement.Application.Features.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Sourcing;

public record AcceptPrForSourcingCommand(long PrId) : IRequest;

/// <summary>Procurement accepts a submitted PR and groups its lines by item category (the default grouping;
/// manual regrouping is not implemented in this build). Each group's required-quote count is resolved from
/// QuotationRules and stored on the group.</summary>
public class AcceptPrForSourcingCommandHandler : IRequestHandler<AcceptPrForSourcingCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public AcceptPrForSourcingCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(AcceptPrForSourcingCommand request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);

        var pendingProcurementStatus = await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.PendingProcurement, ct);
        if (pr.PrStatusId != pendingProcurementStatus.Id)
        {
            throw new BusinessRuleException("This purchase requisition is not awaiting Procurement acceptance.");
        }
        if (!await _currentUser.HasRoleAsync(RoleCodes.Procurement))
        {
            throw new ForbiddenAccessException("Only Procurement may accept a purchase requisition for sourcing.");
        }

        var lines = await _db.PrLines.Include(l => l.Item).Where(l => l.PrId == pr.Id).ToListAsync(ct);
        if (lines.Count == 0)
        {
            throw new BusinessRuleException("This purchase requisition has no lines to source.");
        }

        var groupedByCategory = lines.GroupBy(l => l.Item.CategoryId).ToList();
        var now = DateTime.UtcNow;
        var groupNo = 1;

        foreach (var categoryGroup in groupedByCategory)
        {
            var groupAmount = categoryGroup.Sum(l => l.Qty * l.EstUnitPrice);
            var suggestedVendorId = categoryGroup.Select(l => l.SuggestedVendorId).FirstOrDefault(v => v != null);
            var isStarVendor = false;
            if (suggestedVendorId != null)
            {
                var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == suggestedVendorId, ct);
                isStarVendor = vendor?.IsStarVendor ?? false;
            }

            var rule = await QuotationRuleResolver.ResolveAsync(_db, pr.PolicyVersionId!.Value, pr.SpendSubHeadId, groupAmount, pr.IsEmergency, isStarVendor, ct);

            var group = new SourcingGroups
            {
                PrId = pr.Id,
                GroupNo = groupNo++,
                CategoryId = categoryGroup.Key,
                GroupAmount = groupAmount,
                RequiredQuotes = rule.RequiredQuotes,
                QuotationRuleId = rule.Id,
                CreatedByUserId = _currentUser.UserId,
                CreatedAt = now,
            };
            _db.SourcingGroups.Add(group);
            await _db.SaveChangesAsync(ct);

            foreach (var line in categoryGroup)
            {
                line.SourcingGroupId = group.Id;
            }
        }

        var actorRoleId = (await _db.Roles.FirstAsync(r => r.Code == RoleCodes.Procurement, ct)).Id;
        var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Complete, _currentUser.UserId, actorRoleId, null, new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount }, ct);
        await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);

        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = now;
        await _db.SaveChangesAsync(ct);
    }
}
