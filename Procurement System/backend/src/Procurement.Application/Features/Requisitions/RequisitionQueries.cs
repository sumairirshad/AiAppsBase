using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Requisitions;

public record ListMyPrsQuery : IRequest<List<PrListItemDto>>;

public class ListMyPrsQueryHandler : IRequestHandler<ListMyPrsQuery, List<PrListItemDto>>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    public ListMyPrsQueryHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<PrListItemDto>> Handle(ListMyPrsQuery request, CancellationToken ct)
    {
        var prs = await _db.PurchaseRequisitions.Where(p => p.RequesterId == _currentUser.UserId).OrderByDescending(p => p.CreatedAt).ToListAsync(ct);
        return await PrListMapper.MapAsync(_db, prs, ct);
    }
}

public record ListPrInboxQuery : IRequest<List<PrListItemDto>>;

/// <summary>PRs with an open workflow task assigned to one of the caller's roles (and, for department-scoped
/// roles such as HOD, matching department).</summary>
public class ListPrInboxQueryHandler : IRequestHandler<ListPrInboxQuery, List<PrListItemDto>>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    public ListPrInboxQueryHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<PrListItemDto>> Handle(ListPrInboxQuery request, CancellationToken ct)
    {
        var assignments = await _currentUser.GetRoleAssignmentsAsync();
        var roleCodes = assignments.Select(a => a.RoleCode).Distinct().ToList();
        var openStatusId = (await _db.TaskStatuses.FirstAsync(s => s.Code == TaskStatusCodes.Open, ct)).Id;
        var prEntityType = await _db.EntityTypes.FirstAsync(e => e.Code == EntityTypeCodes.PurchaseRequisition, ct);

        var openTasks = await (
            from t in _db.WorkflowTasks
            join r in _db.Roles on t.AssignedRoleId equals r.Id
            join wi in _db.WorkflowInstances on t.InstanceId equals wi.Id
            where t.TaskStatusId == openStatusId && roleCodes.Contains(r.Code) && wi.EntityTypeId == prEntityType.Id
            select new { t.ScopeDepartmentId, t.AssignedUserId, r.Code, wi.EntityId }
        ).ToListAsync(ct);

        var candidatePrIds = openTasks.Select(t => t.EntityId).Distinct().ToList();
        var prs = await _db.PurchaseRequisitions.Where(p => candidatePrIds.Contains(p.Id)).ToListAsync(ct);

        var visible = new List<PurchaseRequisitions>();
        foreach (var pr in prs)
        {
            var tasksForPr = openTasks.Where(t => t.EntityId == pr.Id);
            foreach (var t in tasksForPr)
            {
                if (t.AssignedUserId != null && t.AssignedUserId != _currentUser.UserId) continue;
                if (t.ScopeDepartmentId != null && !await _currentUser.HasRoleForDepartmentAsync(t.Code, t.ScopeDepartmentId.Value)) continue;
                visible.Add(pr);
                break;
            }
        }

        return await PrListMapper.MapAsync(_db, visible.OrderByDescending(p => p.SubmittedAt).ToList(), ct);
    }
}

public record GetPrQuery(long PrId) : IRequest<PrDto>;

public class GetPrQueryHandler : IRequestHandler<GetPrQuery, PrDto>
{
    private readonly IProcurementDbContext _db;
    public GetPrQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<PrDto> Handle(GetPrQuery request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);

        var requester = await _db.Users.FirstAsync(u => u.Id == pr.RequesterId, ct);
        var department = await _db.Departments.FirstAsync(d => d.Id == pr.DepartmentId, ct);
        var location = await _db.Locations.FirstAsync(l => l.Id == pr.LocationId, ct);
        var subHead = await _db.SpendSubHeads.FirstAsync(s => s.Id == pr.SpendSubHeadId, ct);
        var costType = await _db.CostTypes.FirstAsync(c => c.Id == pr.CostTypeId, ct);
        var status = await _db.PrStatuses.FirstAsync(s => s.Id == pr.PrStatusId, ct);

        var lines = await (
            from l in _db.PrLines
            join i in _db.Items on l.ItemId equals i.Id
            join u in _db.Units on l.UnitId equals u.Id
            join loc in _db.Locations on l.LocationId equals loc.Id
            where l.PrId == pr.Id
            orderby l.LineNo
            select new PrLineDto(l.Id, l.LineNo, i.Id, i.Name, l.Description, l.Qty, u.Code, l.EstUnitPrice, l.LineTotal, loc.Id, loc.Name, l.SuggestedVendorId, l.AwardedVendorId, l.AcceptedQty)
        ).ToListAsync(ct);

        var bill = await _db.PrBills.FirstOrDefaultAsync(b => b.PrId == pr.Id, ct);

        string? currentStageCode = null, currentStageRole = null;
        if (pr.WorkflowInstanceId != null)
        {
            var instance = await _db.WorkflowInstances.FirstOrDefaultAsync(i => i.Id == pr.WorkflowInstanceId, ct);
            if (instance?.CurrentStageId != null)
            {
                var stage = await _db.WorkflowStages.FirstAsync(s => s.Id == instance.CurrentStageId, ct);
                currentStageCode = stage.StageCode;
                if (stage.RoleId != null) currentStageRole = (await _db.Roles.FirstAsync(r => r.Id == stage.RoleId, ct)).Code;
            }
        }

        return new PrDto(
            pr.Id, pr.PrNumber, pr.RequesterId, requester.DisplayName, pr.DepartmentId, department.Name,
            pr.LocationId, location.Name, subHead.Code, subHead.Name, costType.Code,
            pr.IsEmergency, pr.EmergencyJustification, pr.Title, pr.EstimatedAmount, pr.ApprovedAmount,
            pr.FinalAmount, status.Code, status.Name, pr.CreatedAt, pr.SubmittedAt, pr.ClosedAt, pr.RaisedOnBehalf,
            lines, bill?.BillingPeriod, bill?.BillAmount, bill?.Purpose, bill?.DueDate, currentStageCode, currentStageRole, pr.WorkflowInstanceId);
    }
}

public record GetPrTimelineQuery(long PrId) : IRequest<List<PrTimelineEntryDto>>;

public class GetPrTimelineQueryHandler : IRequestHandler<GetPrTimelineQuery, List<PrTimelineEntryDto>>
{
    private readonly IProcurementDbContext _db;
    public GetPrTimelineQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<PrTimelineEntryDto>> Handle(GetPrTimelineQuery request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        if (pr.WorkflowInstanceId == null) return new List<PrTimelineEntryDto>();

        var actions = await _db.WorkflowActions.Where(a => a.InstanceId == pr.WorkflowInstanceId).OrderBy(a => a.ActedAt).ToListAsync(ct);
        var actionTypes = await _db.ActionTypes.ToDictionaryAsync(a => a.Id, ct);
        var stages = await _db.WorkflowStages.ToDictionaryAsync(s => s.Id, ct);
        var users = await _db.Users.ToDictionaryAsync(u => u.Id, ct);
        var roles = await _db.Roles.ToDictionaryAsync(r => r.Id, ct);

        return actions.Select(a => new PrTimelineEntryDto(
            a.ActedAt, users[a.ActorUserId].DisplayName, roles[a.ActorRoleId].Name, actionTypes[a.ActionTypeId].Name,
            a.FromStageId != null ? stages[a.FromStageId.Value].StageCode : null,
            a.ToStageId != null ? stages[a.ToStageId.Value].StageCode : null,
            a.Remarks)).ToList();
    }
}

internal static class PrListMapper
{
    public static async Task<List<PrListItemDto>> MapAsync(IProcurementDbContext db, List<PurchaseRequisitions> prs, CancellationToken ct)
    {
        if (prs.Count == 0) return new List<PrListItemDto>();

        var users = await db.Users.ToDictionaryAsync(u => u.Id, ct);
        var departments = await db.Departments.ToDictionaryAsync(d => d.Id, ct);
        var subHeads = await db.SpendSubHeads.ToDictionaryAsync(s => s.Id, ct);
        var statuses = await db.PrStatuses.ToDictionaryAsync(s => s.Id, ct);

        var instanceIds = prs.Where(p => p.WorkflowInstanceId != null).Select(p => p.WorkflowInstanceId!.Value).ToList();
        var instances = await db.WorkflowInstances.Where(i => instanceIds.Contains(i.Id)).ToListAsync(ct);
        var stageIds = instances.Where(i => i.CurrentStageId != null).Select(i => i.CurrentStageId!.Value).Distinct().ToList();
        var stages = await db.WorkflowStages.Where(s => stageIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id, ct);

        return prs.Select(p =>
        {
            string? stageCode = null;
            var instance = instances.FirstOrDefault(i => i.Id == p.WorkflowInstanceId);
            if (instance?.CurrentStageId != null && stages.TryGetValue(instance.CurrentStageId.Value, out var stage)) stageCode = stage.StageCode;

            return new PrListItemDto(
                p.Id, p.PrNumber, users[p.RequesterId].DisplayName, departments[p.DepartmentId].Name,
                subHeads[p.SpendSubHeadId].Name, p.Title, p.EstimatedAmount, statuses[p.PrStatusId].Code,
                statuses[p.PrStatusId].Name, p.CreatedAt, stageCode);
        }).ToList();
    }
}
