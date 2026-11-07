using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Catalog;

public record CreateCategoryCommand(long ActorUserId, string Code, string Name, long? ParentId) : IRequest<long>;

public class CreateCategoryHandler : IRequestHandler<CreateCategoryCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public CreateCategoryHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task<long> Handle(CreateCategoryCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "CATALOG.MANAGE", ct);
        if (await _db.Categories.AnyAsync(c => c.Code == request.Code, ct))
            throw new InvalidOperationException($"Category code '{request.Code}' already exists.");

        var category = new Categories { Code = request.Code, Name = request.Name, ParentId = request.ParentId, CreatedBy = request.ActorUserId };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync(ct);
        return category.Id;
    }
}

public record MapDepartmentCategoryCommand(long ActorUserId, long DepartmentId, long CategoryId) : IRequest;

public class MapDepartmentCategoryHandler : IRequestHandler<MapDepartmentCategoryCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public MapDepartmentCategoryHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task Handle(MapDepartmentCategoryCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "CATALOG.MANAGE", ct);
        var exists = await _db.DepartmentCategories.AnyAsync(
            dc => dc.DepartmentId == request.DepartmentId && dc.CategoryId == request.CategoryId, ct);
        if (exists) return;
        _db.DepartmentCategories.Add(new DepartmentCategories { DepartmentId = request.DepartmentId, CategoryId = request.CategoryId });
        await _db.SaveChangesAsync(ct);
    }
}

public record CreateUnitCommand(long ActorUserId, string Code, string Name, byte Precision) : IRequest<long>;

public class CreateUnitHandler : IRequestHandler<CreateUnitCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public CreateUnitHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task<long> Handle(CreateUnitCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "CATALOG.MANAGE", ct);
        var unit = new Domain.Entities.Units { Code = request.Code, Name = request.Name, Precision = request.Precision };
        _db.Set<Domain.Entities.Units>().Add(unit);
        await _db.SaveChangesAsync(ct);
        return unit.Id;
    }
}

// BR-004: items are scoped to categories, which are scoped to departments - but any user who
// can see a category (because their department maps to it) can propose a new item in it via
// ItemRequests, decided by OPD (BR handled in ItemRequestCommands).
public record CreateItemCommand(long ActorUserId, string Code, string Name, long CategoryId, long UnitId) : IRequest<long>;

public class CreateItemHandler : IRequestHandler<CreateItemCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public CreateItemHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task<long> Handle(CreateItemCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "CATALOG.MANAGE", ct);
        if (await _db.Items.AnyAsync(i => i.Code == request.Code, ct))
            throw new InvalidOperationException($"Item code '{request.Code}' already exists.");

        var item = new Items { Code = request.Code, Name = request.Name, CategoryId = request.CategoryId, UnitId = request.UnitId, CreatedBy = request.ActorUserId };
        _db.Items.Add(item);
        await _db.SaveChangesAsync(ct);
        return item.Id;
    }
}

public record CreateItemRequestCommand(long ActorUserId, string RequestType, string ProposedName, long? CategoryId) : IRequest<long>;

public class CreateItemRequestHandler : IRequestHandler<CreateItemRequestCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly LookupCache _lookups;

    public CreateItemRequestHandler(IApplicationDbContext db, LookupCache lookups)
    {
        _db = db;
        _lookups = lookups;
    }

    public async Task<long> Handle(CreateItemRequestCommand request, CancellationToken ct)
    {
        var pendingStatus = await _lookups.IdAsync<Domain.Entities.ApprovalRequestStatuses, short>("PendingOpd", ct);
        var itemRequest = new ItemRequests
        {
            RequestType = request.RequestType,
            ProposedName = request.ProposedName,
            CategoryId = request.CategoryId,
            RequestedBy = request.ActorUserId,
            StatusId = pendingStatus,
            CreatedBy = request.ActorUserId,
        };
        _db.Set<ItemRequests>().Add(itemRequest);
        await _db.SaveChangesAsync(ct);
        return itemRequest.Id;
    }
}

public record ItemRequestDto(long Id, string RequestType, string ProposedName, long? CategoryId, string? CategoryName, string RequestedByName, DateTime CreatedAt);

// OPD previously had no way to discover a pending item/category request except being told
// its id out of band - this lists everything still awaiting their decision.
public record ListPendingItemRequestsQuery : IRequest<List<ItemRequestDto>>;

public class ListPendingItemRequestsHandler : IRequestHandler<ListPendingItemRequestsQuery, List<ItemRequestDto>>
{
    private readonly IApplicationDbContext _db;
    private readonly LookupCache _lookups;

    public ListPendingItemRequestsHandler(IApplicationDbContext db, LookupCache lookups)
    {
        _db = db;
        _lookups = lookups;
    }

    public async Task<List<ItemRequestDto>> Handle(ListPendingItemRequestsQuery request, CancellationToken ct)
    {
        var pendingStatus = await _lookups.IdAsync<Domain.Entities.ApprovalRequestStatuses, short>("PendingOpd", ct);
        var requests = await _db.Set<ItemRequests>().Where(r => r.StatusId == pendingStatus).OrderBy(r => r.Id).ToListAsync(ct);
        if (requests.Count == 0) return new List<ItemRequestDto>();

        var categories = await _db.Categories.Where(c => requests.Select(r => r.CategoryId).Contains(c.Id)).ToDictionaryAsync(c => c.Id, c => c.Name, ct);
        var requesters = await _db.Users.Where(u => requests.Select(r => r.RequestedBy).Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.DisplayName, ct);

        return requests.Select(r => new ItemRequestDto(
            r.Id, r.RequestType, r.ProposedName, r.CategoryId, r.CategoryId.HasValue ? categories.GetValueOrDefault(r.CategoryId.Value) : null,
            requesters.GetValueOrDefault(r.RequestedBy, "Unknown"), r.CreatedAt)).ToList();
    }
}

public record DecideItemRequestCommand(long ActorUserId, long ItemRequestId, bool Approve, string? Reason, long? UnitId) : IRequest;

public class DecideItemRequestHandler : IRequestHandler<DecideItemRequestCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;

    public DecideItemRequestHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
    }

    public async Task Handle(DecideItemRequestCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "ITEMREQUEST.DECIDE", ct);
        var itemRequest = await _db.Set<ItemRequests>().FirstOrDefaultAsync(r => r.Id == request.ItemRequestId, ct)
            ?? throw new InvalidOperationException("Item request not found.");

        if (!request.Approve && string.IsNullOrWhiteSpace(request.Reason))
            throw new InvalidOperationException("A reason is required to reject an item request.");

        if (request.Approve)
        {
            if (itemRequest.RequestType == "Item")
            {
                if (itemRequest.CategoryId is null || request.UnitId is null)
                    throw new InvalidOperationException("Approving an item request needs a category and a unit.");
                var item = new Items
                {
                    Code = $"ITM-{itemRequest.Id:D5}",
                    Name = itemRequest.ProposedName,
                    CategoryId = itemRequest.CategoryId.Value,
                    UnitId = request.UnitId.Value,
                    CreatedBy = request.ActorUserId,
                };
                _db.Items.Add(item);
                await _db.SaveChangesAsync(ct);
                itemRequest.CreatedItemId = item.Id;
            }
            else
            {
                var category = new Categories { Code = $"CAT-{itemRequest.Id:D5}", Name = itemRequest.ProposedName, ParentId = itemRequest.CategoryId, CreatedBy = request.ActorUserId };
                _db.Categories.Add(category);
                await _db.SaveChangesAsync(ct);
            }
        }

        itemRequest.StatusId = await _lookups.IdAsync<Domain.Entities.ApprovalRequestStatuses, short>(request.Approve ? "Approved" : "Rejected", ct);
        itemRequest.DecisionBy = request.ActorUserId;
        itemRequest.DecisionReason = request.Reason;
        itemRequest.UpdatedBy = request.ActorUserId;
        itemRequest.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
