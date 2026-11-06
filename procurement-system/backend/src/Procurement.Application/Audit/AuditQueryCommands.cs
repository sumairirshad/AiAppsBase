using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Audit;

// BR-042: Audit (or any approver, at their own stage) can raise a query; it routes to the
// responsible role and pauses the PR as Queried until answered, then resumes at exactly the
// stage it was queried from - never further back, never skipping the reviewer who asked.
public record RaiseQueryCommand(long ActorUserId, long PrId, string QueryText, string AssignedRoleCode) : IRequest<long>;

public class RaiseQueryHandler : IRequestHandler<RaiseQueryCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IWorkflowEngine _workflow;
    private readonly LookupCache _lookups;

    public RaiseQueryHandler(IApplicationDbContext db, IWorkflowEngine workflow, LookupCache lookups)
    {
        _db = db;
        _workflow = workflow;
        _lookups = lookups;
    }

    public async Task<long> Handle(RaiseQueryCommand request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        if (pr.WorkflowInstanceId is null) throw new InvalidOperationException("This PR has no active workflow instance.");

        var entityTypeId = await _lookups.IdAsync<Domain.Entities.EntityTypes, short>("PurchaseRequisition", ct);
        var assignedRoleId = await _lookups.IdAsync<Roles, long>(request.AssignedRoleCode, ct);
        var openStatus = await _lookups.IdAsync<QueryStatuses, short>("Open", ct);

        var query = new AuditQueries
        {
            EntityTypeId = entityTypeId,
            EntityId = pr.Id,
            RaisedBy = request.ActorUserId,
            AssignedRoleId = assignedRoleId,
            QueryText = request.QueryText,
            QueryStatusId = openStatus,
            CreatedBy = request.ActorUserId,
        };
        _db.Set<AuditQueries>().Add(query);
        await _db.SaveChangesAsync(ct);

        // Reuse the generic Act pipeline's Query action so the workflow task/history stays
        // consistent with every other "pause this stage" move.
        var actorRoleId = await ResolveActorRoleAsync(request.ActorUserId, ct);
        await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
            pr.WorkflowInstanceId.Value, request.ActorUserId, actorRoleId, WorkflowActionCode.Query,
            pr.RequesterId, pr.DepartmentId, request.QueryText, pr.EstimatedAmount), ct);

        pr.PrStatusId = await _lookups.IdAsync<PrStatuses, short>("Queried", ct);
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return query.Id;
    }

    private async Task<long> ResolveActorRoleAsync(long userId, CancellationToken ct)
    {
        var task = await _db.WorkflowTasks.Where(t => t.AssignedUserId == userId).OrderByDescending(t => t.Id).Select(t => t.AssignedRoleId).FirstOrDefaultAsync(ct);
        if (task != 0) return task;
        return await _lookups.IdAsync<Roles, long>("AUDIT", ct);
    }
}

public record RespondQueryCommand(long ActorUserId, long QueryId, string ResponseText) : IRequest<SubmitPrResult>;

public class RespondQueryHandler : IRequestHandler<RespondQueryCommand, SubmitPrResult>
{
    private readonly IApplicationDbContext _db;
    private readonly IWorkflowEngine _workflow;
    private readonly LookupCache _lookups;

    public RespondQueryHandler(IApplicationDbContext db, IWorkflowEngine workflow, LookupCache lookups)
    {
        _db = db;
        _workflow = workflow;
        _lookups = lookups;
    }

    public async Task<SubmitPrResult> Handle(RespondQueryCommand request, CancellationToken ct)
    {
        var query = await _db.Set<AuditQueries>().FirstOrDefaultAsync(q => q.Id == request.QueryId, ct)
            ?? throw new InvalidOperationException("Query not found.");
        var respondedStatus = await _lookups.IdAsync<QueryStatuses, short>("Responded", ct);
        query.ResponseText = request.ResponseText;
        query.RespondedAt = DateTime.UtcNow;
        query.QueryStatusId = respondedStatus;
        await _db.SaveChangesAsync(ct);

        var pr = await _db.PurchaseRequisitions.FirstAsync(p => p.Id == query.EntityId, ct);
        var resumed = await _workflow.ResumeAsync(pr.WorkflowInstanceId!.Value, request.ActorUserId, ct);

        var definitionId = await _db.WorkflowInstances.Where(i => i.Id == pr.WorkflowInstanceId!.Value).Select(i => i.DefinitionId).FirstAsync(ct);
        var statusId = resumed.CurrentStageCode is null
            ? await _lookups.IdAsync<PrStatuses, short>("Closed", ct)
            : (await _db.WorkflowStages.FirstOrDefaultAsync(s => s.DefinitionId == definitionId && s.StageCode == resumed.CurrentStageCode, ct))?.PrStatusId
              ?? pr.PrStatusId;
        pr.PrStatusId = statusId;
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return new SubmitPrResult((await _db.PrStatuses.FindAsync(new object[] { statusId }, ct))!.Code, resumed.NextRole);
    }
}

// BR-042/045: Audit compares a bill PR against the last 12 months (ONUSAGE_HISTORY_DAYS) and
// either approves (-> Finance) or queries it.
public record AuditBillReviewQuery(long PrId) : IRequest<BillHistoryDto>;
public record BillHistoryDto(decimal CurrentAmount, List<decimal> LastYearAmounts, decimal? Average, bool LooksUnusual);

public class AuditBillReviewHandler : IRequestHandler<AuditBillReviewQuery, BillHistoryDto>
{
    private readonly IApplicationDbContext _db;

    public AuditBillReviewHandler(IApplicationDbContext db) => _db = db;

    public async Task<BillHistoryDto> Handle(AuditBillReviewQuery request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstAsync(p => p.Id == request.PrId, ct);
        var cutoff = DateTime.UtcNow.AddDays(-365);

        var history = await _db.PurchaseRequisitions
            .Where(p => p.DepartmentId == pr.DepartmentId && p.SpendSubHeadId == pr.SpendSubHeadId && p.Id != pr.Id && p.CreatedAt >= cutoff)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => p.EstimatedAmount)
            .ToListAsync(ct);

        decimal? average = history.Count > 0 ? history.Average() : null;
        var unusual = average.HasValue && Math.Abs(pr.EstimatedAmount - average.Value) > average.Value * 0.5m;

        return new BillHistoryDto(pr.EstimatedAmount, history, average, unusual);
    }
}
