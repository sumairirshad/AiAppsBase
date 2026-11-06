using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Workflow;

namespace Procurement.Application.Requisitions;

public record PrListItemDto(long Id, string PrNumber, string Title, decimal EstimatedAmount, string StatusCode, string DepartmentCode, DateTime? SubmittedAt, bool IsEmergency);
public record PrLineDto(long Id, long ItemId, string ItemName, decimal Qty, string UnitCode, decimal EstUnitPrice, decimal LineTotal, decimal? MarketPriceAtRequest, decimal? LastPaidPriceAtRequest, decimal? PriceWarningPct, long? SuggestedVendorId, long? AwardedVendorId, string? OverrideReason);
public record PrDetailDto(long Id, string PrNumber, string Title, string StatusCode, decimal EstimatedAmount, long DepartmentId, long RequesterId, bool IsEmergency, List<PrLineDto> Lines, List<string> AllowedActions);

// "My Requests": requester's own PRs, any status.
public record ListMyPrsQuery(long UserId) : IRequest<List<PrListItemDto>>;

// Role-scoped inbox: PRs where it is this user's turn, driven by the open WorkflowTask -
// never by the client guessing status, exactly as the architecture spec requires.
public record ListInboxQuery(long UserId, string RoleCode) : IRequest<List<PrListItemDto>>;

public record GetPrDetailQuery(long UserId, long PrId) : IRequest<PrDetailDto>;

public class PrQueryHandlers :
    IRequestHandler<ListMyPrsQuery, List<PrListItemDto>>,
    IRequestHandler<ListInboxQuery, List<PrListItemDto>>,
    IRequestHandler<GetPrDetailQuery, PrDetailDto>
{
    private readonly IApplicationDbContext _db;
    private readonly UserAccessService _access;
    private readonly IWorkflowEngine _workflow;

    public PrQueryHandlers(IApplicationDbContext db, UserAccessService access, IWorkflowEngine workflow)
    {
        _db = db;
        _access = access;
        _workflow = workflow;
    }

    private IQueryable<PrListItemDto> BaseProjection() =>
        _db.PurchaseRequisitions
            .Join(_db.PrStatuses, p => p.PrStatusId, s => s.Id, (p, s) => new { p, s.Code })
            .Join(_db.Departments, x => x.p.DepartmentId, d => d.Id, (x, d) => new PrListItemDto(
                x.p.Id, x.p.PrNumber, x.p.Title, x.p.EstimatedAmount, x.Code, d.Code, x.p.SubmittedAt, x.p.IsEmergency));

    public async Task<List<PrListItemDto>> Handle(ListMyPrsQuery request, CancellationToken ct) =>
        await _db.PurchaseRequisitions.Where(p => p.RequesterId == request.UserId)
            .Join(_db.PrStatuses, p => p.PrStatusId, s => s.Id, (p, s) => new { p, s.Code })
            .Join(_db.Departments, x => x.p.DepartmentId, d => d.Id, (x, d) => new PrListItemDto(
                x.p.Id, x.p.PrNumber, x.p.Title, x.p.EstimatedAmount, x.Code, d.Code, x.p.SubmittedAt, x.p.IsEmergency))
            .OrderByDescending(x => x.Id).ToListAsync(ct);

    public async Task<List<PrListItemDto>> Handle(ListInboxQuery request, CancellationToken ct)
    {
        var assignments = await _access.GetAssignmentsAsync(request.UserId, ct);
        var roleIds = assignments.Where(a => a.RoleCode == request.RoleCode).Select(a => a.RoleId).ToList();
        if (roleIds.Count == 0) return new List<PrListItemDto>();

        var openStatusId = await OpenStatusIdAsync(ct);
        var instanceIds = await _db.WorkflowTasks
            .Where(t => t.TaskStatusId == openStatusId &&
                (roleIds.Contains(t.AssignedRoleId) || (t.EscalatedAt != null && t.EscalatedToRoleId != null && roleIds.Contains(t.EscalatedToRoleId.Value))))
            .Select(t => t.InstanceId).Distinct().ToListAsync(ct);

        var prIds = await _db.PurchaseRequisitions.Where(p => p.WorkflowInstanceId != null && instanceIds.Contains(p.WorkflowInstanceId.Value))
            .Select(p => p.Id).ToListAsync(ct);

        // Department-scoped roles (HOD) only see PRs in their own department(s).
        var scopedDeptIds = assignments.Where(a => a.RoleCode == request.RoleCode && a.DepartmentId.HasValue).Select(a => a.DepartmentId!.Value).ToHashSet();
        var unscoped = assignments.Any(a => a.RoleCode == request.RoleCode && a.DepartmentId is null);

        var results = await BaseProjection().Where(x => prIds.Contains(x.Id)).OrderBy(x => x.SubmittedAt).ToListAsync(ct);
        if (unscoped || scopedDeptIds.Count == 0) return results;

        var deptCodes = await _db.Departments.Where(d => scopedDeptIds.Contains(d.Id)).Select(d => d.Code).ToListAsync(ct);
        return results.Where(r => deptCodes.Contains(r.DepartmentCode)).ToList();
    }

    public async Task<PrDetailDto> Handle(GetPrDetailQuery request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        var status = await _db.PrStatuses.FirstAsync(s => s.Id == pr.PrStatusId, ct);

        var lines = await _db.PrLines.Where(l => l.PrId == pr.Id)
            .Join(_db.Items, l => l.ItemId, i => i.Id, (l, i) => new { l, i.Name })
            .Join(_db.Set<Domain.Entities.Units>(), x => x.l.UnitId, u => u.Id, (x, u) => new PrLineDto(
                x.l.Id, x.l.ItemId, x.Name, x.l.Qty, u.Code, x.l.EstUnitPrice, x.l.Qty * x.l.EstUnitPrice,
                x.l.MarketPriceAtRequest, x.l.LastPaidPriceAtRequest, x.l.PriceWarningPct, x.l.SuggestedVendorId, x.l.AwardedVendorId, x.l.OverrideReason))
            .ToListAsync(ct);

        var allowedActions = new List<string>();
        if (pr.WorkflowInstanceId.HasValue)
        {
            var roleIds = (await _access.GetAssignmentsAsync(request.UserId, ct)).Select(a => a.RoleId).ToList();
            allowedActions = (await _workflow.GetAllowedActionsAsync(pr.WorkflowInstanceId.Value, request.UserId, roleIds, ct)).ToList();
        }

        return new PrDetailDto(pr.Id, pr.PrNumber, pr.Title, status.Code, pr.EstimatedAmount, pr.DepartmentId, pr.RequesterId, pr.IsEmergency, lines, allowedActions);
    }

    private async Task<short> OpenStatusIdAsync(CancellationToken ct) =>
        (await _db.TaskStatuses.FirstAsync(s => s.Code == "Open", ct)).Id;
}
