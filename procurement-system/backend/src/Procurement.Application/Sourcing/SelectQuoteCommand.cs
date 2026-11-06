using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Alerts;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Policy;
using Procurement.Application.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Sourcing;

// BR-029/030: the lowest quote is recommended; Audit may accept it or select a justified
// higher one. A PR has one QUOTE_REVIEW workflow task covering every sourcing group on it, so
// the task only completes - and the next stage (OPD exception, if triggered) only opens -
// once every group on the PR has been decided.
public record SelectQuoteCommand(long ActorUserId, long SourcingGroupId, long QuotationId, string? Justification) : IRequest<SubmitPrResult>;

public class SelectQuoteHandler : IRequestHandler<SelectQuoteCommand, SubmitPrResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly IWorkflowEngine _workflow;
    private readonly IPolicySettingsReader _settings;
    private readonly LookupCache _lookups;
    private readonly NotificationService _notifications;

    public SelectQuoteHandler(IApplicationDbContext db, IPermissionChecker permissions, IWorkflowEngine workflow, IPolicySettingsReader settings, LookupCache lookups, NotificationService notifications)
    {
        _db = db;
        _permissions = permissions;
        _workflow = workflow;
        _settings = settings;
        _lookups = lookups;
        _notifications = notifications;
    }

    public async Task<SubmitPrResult> Handle(SelectQuoteCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "SOURCING.QUOTE_REVIEW", ct);

        var group = await _db.Set<SourcingGroups>().FirstOrDefaultAsync(g => g.Id == request.SourcingGroupId, ct)
            ?? throw new InvalidOperationException("Sourcing group not found.");
        var quote = await _db.Quotations.FirstOrDefaultAsync(q => q.Id == request.QuotationId && q.SourcingGroupId == group.Id, ct)
            ?? throw new InvalidOperationException("That quotation is not part of this sourcing group.");

        var isHigher = request.QuotationId != group.RecommendedQuotationId;
        if (isHigher && string.IsNullOrWhiteSpace(request.Justification))
            throw new InvalidOperationException("Selecting a higher-than-lowest quote needs a written justification.");

        group.SelectedQuotationId = request.QuotationId;
        group.SelectionJustification = request.Justification;
        group.SelectedBy = request.ActorUserId;
        await _db.SaveChangesAsync(ct);

        foreach (var line in await _db.PrLines.Where(l => l.SourcingGroupId == group.Id).ToListAsync(ct))
        {
            line.AwardedVendorId = quote.VendorId;
            line.AwardedQuotationLineId = await _db.Set<QuotationLines>()
                .Where(ql => ql.QuotationId == quote.Id && ql.PrLineId == line.Id).Select(ql => ql.Id).FirstOrDefaultAsync(ct);
        }
        await _db.SaveChangesAsync(ct);

        var pr = await _db.PurchaseRequisitions.FirstAsync(p => p.Id == group.PrId, ct);
        var allGroups = await _db.Set<SourcingGroups>().Where(g => g.PrId == pr.Id).ToListAsync(ct);
        var allDecided = allGroups.All(g => g.SelectedQuotationId.HasValue);
        if (!allDecided)
            return new SubmitPrResult("PendingQuoteReview", "AUDIT");

        // BR-030/TC-063/064: the high-quote alert fires whenever a higher-than-lowest quote
        // is chosen, regardless of amount; only the extra OPD approval stage is gated by the
        // OPD_QUOTE_EXCEPTION_THRESHOLD.
        var anyHigher = allGroups.Any(g => g.SelectedQuotationId != g.RecommendedQuotationId);
        var needsOpdException = false;
        if (anyHigher)
        {
            _db.Set<AiChecks>().Add(new AiChecks
            {
                CheckTypeId = await _lookups.IdAsync<AiCheckTypes, short>("HighQuote", ct),
                EntityTypeId = await _lookups.IdAsync<Domain.Entities.EntityTypes, short>("PurchaseRequisition", ct),
                EntityId = pr.Id,
                Outcome = "Warn",
                CheckedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync(ct);
            await _notifications.NotifyHighQuoteAsync(pr.Id, pr.DepartmentId,
                $"A higher-than-lowest quote was chosen on {pr.PrNumber}.", ct);

            var threshold = await _settings.GetDecimalAsync(pr.PolicyVersionId ?? 0, "OPD_QUOTE_EXCEPTION_THRESHOLD", 1_000_000, ct);
            needsOpdException = pr.EstimatedAmount > threshold;
        }

        var definitionId = await _db.WorkflowInstances.Where(i => i.Id == pr.WorkflowInstanceId!.Value).Select(i => i.DefinitionId).FirstAsync(ct);
        var auditRoleId = await _lookups.IdAsync<Roles, long>("AUDIT", ct);
        var result = await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
            pr.WorkflowInstanceId!.Value, request.ActorUserId, auditRoleId, WorkflowActionCode.Approve,
            pr.RequesterId, pr.DepartmentId, Remarks: null, CurrentAmount: pr.EstimatedAmount, IsHigherQuote: needsOpdException), ct);

        var statusId = result.CurrentStageCode is null
            ? await _lookups.IdAsync<PrStatuses, short>("Closed", ct)
            : (await _db.WorkflowStages.FirstOrDefaultAsync(s => s.DefinitionId == definitionId && s.StageCode == result.CurrentStageCode, ct))?.PrStatusId
              ?? await _lookups.IdAsync<PrStatuses, short>("PoPreparation", ct);

        pr.PrStatusId = statusId;
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new SubmitPrResult((await _db.PrStatuses.FindAsync(new object[] { statusId }, ct))!.Code, result.NextRole);
    }
}
