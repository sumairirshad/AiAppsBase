using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Common.Notify;
using Procurement.Application.Common.Policy;
using Procurement.Application.Features.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Sourcing;

public record SelectQuotationCommand(long SourcingGroupId, long QuotationId, string? Justification) : IRequest;

/// <summary>Audit (or OPD, for the high-quote-above-threshold exception) selects the quotation for a group.
/// Selecting anything other than the recommended (lowest) quotation requires a justification and fires the
/// high-quote alert.</summary>
public class SelectQuotationCommandHandler : IRequestHandler<SelectQuotationCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;

    public SelectQuotationCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(SelectQuotationCommand request, CancellationToken ct)
    {
        if (!await _currentUser.HasRoleAsync(RoleCodes.Audit) && !await _currentUser.HasRoleAsync(RoleCodes.Opd))
        {
            throw new ForbiddenAccessException("Only Audit or OPD may select the awarded quotation for a group.");
        }

        var group = await _db.SourcingGroups.FirstOrDefaultAsync(g => g.Id == request.SourcingGroupId, ct)
            ?? throw new NotFoundException("SourcingGroup", request.SourcingGroupId);
        var quotation = await _db.Quotations.FirstOrDefaultAsync(q => q.Id == request.QuotationId && q.SourcingGroupId == group.Id, ct)
            ?? throw new NotFoundException("Quotation", request.QuotationId);

        var isHigherQuote = group.RecommendedQuotationId != null && quotation.Id != group.RecommendedQuotationId;
        if (isHigherQuote && string.IsNullOrWhiteSpace(request.Justification))
        {
            throw new BusinessRuleException("A written justification is required when selecting a quotation other than the lowest.");
        }

        group.SelectedQuotationId = quotation.Id;
        group.SelectionJustification = isHigherQuote ? request.Justification : null;
        group.SelectedBy = _currentUser.UserId;
        group.UpdatedByUserId = _currentUser.UserId;
        group.UpdatedAt = DateTime.UtcNow;

        var lines = await _db.PrLines.Where(l => l.SourcingGroupId == group.Id).ToListAsync(ct);
        var quotationLines = await _db.QuotationLines.Where(l => l.QuotationId == quotation.Id).ToListAsync(ct);
        foreach (var line in lines)
        {
            line.AwardedVendorId = quotation.VendorId;
            line.AwardedQuotationLineId = quotationLines.FirstOrDefault(ql => ql.PrLineId == line.Id)?.Id;
        }

        if (isHigherQuote)
        {
            var pr = await _db.PurchaseRequisitions.FirstAsync(p => p.Id == group.PrId, ct);
            var entityType = await _db.EntityTypes.FirstAsync(e => e.Code == EntityTypeCodes.PurchaseRequisition, ct);
            foreach (var roleCode in new[] { RoleCodes.Hod, RoleCodes.Procurement, RoleCodes.Finance, RoleCodes.Audit, RoleCodes.Opd })
            {
                await NotificationWriter.AddAsync(
                    _db, NotificationTypeCodes.HighQuoteAlert, entityType.Id, pr.Id,
                    $"A higher-than-lowest quotation was selected for {pr.PrNumber}, group {group.GroupNo}.",
                    $"highquote-{group.Id}", ct, roleId: (await _db.Roles.FirstAsync(r => r.Code == roleCode, ct)).Id);
            }
        }

        await _db.SaveChangesAsync(ct);
    }
}

public record CompleteQuoteReviewCommand(long PrId) : IRequest;

public class CompleteQuoteReviewCommandHandler : IRequestHandler<CompleteQuoteReviewCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public CompleteQuoteReviewCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(CompleteQuoteReviewCommand request, CancellationToken ct)
    {
        if (!await _currentUser.HasRoleAsync(RoleCodes.Audit))
        {
            throw new ForbiddenAccessException("Only Audit may complete quote review.");
        }

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        var groups = await _db.SourcingGroups.Where(g => g.PrId == pr.Id).ToListAsync(ct);

        if (groups.Any(g => g.RequiredQuotes > 0 && g.SelectedQuotationId == null))
        {
            throw new BusinessRuleException("Every sourcing group with quotations must have an awarded quotation selected.");
        }

        var isHigherQuote = groups.Any(g => g.SelectionJustification != null);
        var settings = await PolicyVersionResolver.GetSettingsAsync(_db, pr.PolicyVersionId!.Value, ct);
        var opdThreshold = decimal.Parse(settings.GetValueOrDefault(PolicySettingKeys.OpdQuoteExceptionThreshold, "1000000"));

        var actorRoleId = (await _db.Roles.FirstAsync(r => r.Code == RoleCodes.Audit, ct)).Id;
        var context = new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount, ["IsHigherQuote"] = isHigherQuote };
        var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Approve, _currentUser.UserId, actorRoleId, null, context, ct);
        await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);

        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

public record OpdQuoteExceptionDecisionCommand(long PrId, bool Approve, string Reason) : IRequest;

public class OpdQuoteExceptionDecisionCommandHandler : IRequestHandler<OpdQuoteExceptionDecisionCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public OpdQuoteExceptionDecisionCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(OpdQuoteExceptionDecisionCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new BusinessRuleException("A reason is required for this decision.");
        }

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        var (_, roleId) = await PrGuards.EnsureCanActOnTaskAsync(_db, _currentUser, _workflowEngine, pr, RoleCodes.Opd, ct);

        foreach (var group in await _db.SourcingGroups.Where(g => g.PrId == pr.Id && g.SelectionJustification != null).ToListAsync(ct))
        {
            group.OpdDecisionBy = _currentUser.UserId;
        }

        if (request.Approve)
        {
            var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Approve, _currentUser.UserId, roleId, request.Reason, new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount }, ct);
            await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);
        }
        else
        {
            await _workflowEngine.TerminateAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Reject, _currentUser.UserId, roleId, request.Reason, ct);
            pr.PrStatusId = (await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.Rejected, ct)).Id;
        }

        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
