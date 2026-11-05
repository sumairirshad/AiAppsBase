using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Admin;

public record CategoryDto(long Id, string Code, string Name, long? ParentId, bool IsActive);
public record ItemDto(long Id, string Code, string Name, long CategoryId, string CategoryName, long UnitId, string UnitCode, bool IsActive);
public record UnitDto(long Id, string Code, string Name, byte Precision);
public record DepartmentCategoryDto(long DepartmentId, long CategoryId, string CategoryCode, string CategoryName);
public record SpendSubHeadDto(long Id, string Code, string Name, bool AllowsTentative, string ProcurementModeCode);

public record ListCategoriesQuery : IRequest<List<CategoryDto>>;
public class ListCategoriesQueryHandler : IRequestHandler<ListCategoriesQuery, List<CategoryDto>>
{
    private readonly IProcurementDbContext _db;
    public ListCategoriesQueryHandler(IProcurementDbContext db) => _db = db;
    public async Task<List<CategoryDto>> Handle(ListCategoriesQuery request, CancellationToken ct) =>
        await _db.Categories.OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Code, c.Name, c.ParentId, c.IsActive))
            .ToListAsync(ct);
}

public record CreateCategoryCommand(string Code, string Name, long? ParentId) : IRequest<long>;
public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    public CreateCategoryCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }
    public async Task<long> Handle(CreateCategoryCommand request, CancellationToken ct)
    {
        if (await _db.Categories.AnyAsync(c => c.Code == request.Code, ct))
        {
            throw new ConflictException($"Category code '{request.Code}' already exists.");
        }
        var category = new Categories
        {
            Code = request.Code, Name = request.Name, ParentId = request.ParentId, IsActive = true,
            CreatedByUserId = _currentUser.UserId, CreatedAt = DateTime.UtcNow,
        };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync(ct);
        return category.Id;
    }
}

public record ListItemsQuery(long? CategoryId) : IRequest<List<ItemDto>>;
public class ListItemsQueryHandler : IRequestHandler<ListItemsQuery, List<ItemDto>>
{
    private readonly IProcurementDbContext _db;
    public ListItemsQueryHandler(IProcurementDbContext db) => _db = db;
    public async Task<List<ItemDto>> Handle(ListItemsQuery request, CancellationToken ct)
    {
        var query = _db.Items.Where(i => i.IsActive);
        if (request.CategoryId != null) query = query.Where(i => i.CategoryId == request.CategoryId);

        var items = await query.Join(_db.Categories, i => i.CategoryId, c => c.Id, (i, c) => new { i, c })
            .Join(_db.Units, x => x.i.UnitId, u => u.Id, (x, u) => new ItemDto(x.i.Id, x.i.Code, x.i.Name, x.c.Id, x.c.Name, u.Id, u.Code, x.i.IsActive))
            .ToListAsync(ct);
        return items.OrderBy(d => d.Name).ToList();
    }
}

public record CreateItemCommand(string Code, string Name, long CategoryId, long UnitId) : IRequest<long>;
public class CreateItemCommandHandler : IRequestHandler<CreateItemCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    public CreateItemCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }
    public async Task<long> Handle(CreateItemCommand request, CancellationToken ct)
    {
        if (await _db.Items.AnyAsync(i => i.Code == request.Code, ct))
        {
            throw new ConflictException($"Item code '{request.Code}' already exists.");
        }
        var item = new Items
        {
            Code = request.Code, Name = request.Name, CategoryId = request.CategoryId, UnitId = request.UnitId, IsActive = true,
            CreatedByUserId = _currentUser.UserId, CreatedAt = DateTime.UtcNow,
        };
        _db.Items.Add(item);
        await _db.SaveChangesAsync(ct);
        return item.Id;
    }
}

public record ListUnitsQuery : IRequest<List<UnitDto>>;
public class ListUnitsQueryHandler : IRequestHandler<ListUnitsQuery, List<UnitDto>>
{
    private readonly IProcurementDbContext _db;
    public ListUnitsQueryHandler(IProcurementDbContext db) => _db = db;
    public async Task<List<UnitDto>> Handle(ListUnitsQuery request, CancellationToken ct) =>
        await _db.Units.OrderBy(u => u.Name).Select(u => new UnitDto(u.Id, u.Code, u.Name, u.Precision)).ToListAsync(ct);
}

public record ListSpendSubHeadsQuery : IRequest<List<SpendSubHeadDto>>;
public class ListSpendSubHeadsQueryHandler : IRequestHandler<ListSpendSubHeadsQuery, List<SpendSubHeadDto>>
{
    private readonly IProcurementDbContext _db;
    public ListSpendSubHeadsQueryHandler(IProcurementDbContext db) => _db = db;
    public async Task<List<SpendSubHeadDto>> Handle(ListSpendSubHeadsQuery request, CancellationToken ct)
    {
        var subHeads = await _db.SpendSubHeads.Join(_db.ProcurementModes, s => s.ProcurementModeId, m => m.Id,
            (s, m) => new SpendSubHeadDto(s.Id, s.Code, s.Name, s.AllowsTentative, m.Code))
            .ToListAsync(ct);
        return subHeads.OrderBy(d => d.Name).ToList();
    }
}

public record ListDepartmentCategoriesQuery(long DepartmentId) : IRequest<List<DepartmentCategoryDto>>;
public class ListDepartmentCategoriesQueryHandler : IRequestHandler<ListDepartmentCategoriesQuery, List<DepartmentCategoryDto>>
{
    private readonly IProcurementDbContext _db;
    public ListDepartmentCategoriesQueryHandler(IProcurementDbContext db) => _db = db;
    public async Task<List<DepartmentCategoryDto>> Handle(ListDepartmentCategoriesQuery request, CancellationToken ct)
    {
        var results = await _db.DepartmentCategories.Where(dc => dc.DepartmentId == request.DepartmentId)
            .Join(_db.Categories, dc => dc.CategoryId, c => c.Id, (dc, c) => new DepartmentCategoryDto(dc.DepartmentId, c.Id, c.Code, c.Name))
            .ToListAsync(ct);
        return results.OrderBy(d => d.CategoryName).ToList();
    }
}

public record SetDepartmentCategoriesCommand(long DepartmentId, List<long> CategoryIds) : IRequest;
public class SetDepartmentCategoriesCommandHandler : IRequestHandler<SetDepartmentCategoriesCommand>
{
    private readonly IProcurementDbContext _db;
    public SetDepartmentCategoriesCommandHandler(IProcurementDbContext db) => _db = db;
    public async Task Handle(SetDepartmentCategoriesCommand request, CancellationToken ct)
    {
        var existing = await _db.DepartmentCategories.Where(dc => dc.DepartmentId == request.DepartmentId).ToListAsync(ct);
        var toRemove = existing.Where(dc => !request.CategoryIds.Contains(dc.CategoryId));
        foreach (var dc in toRemove) _db.DepartmentCategories.Remove(dc);

        var existingCategoryIds = existing.Select(dc => dc.CategoryId).ToHashSet();
        foreach (var categoryId in request.CategoryIds.Where(id => !existingCategoryIds.Contains(id)))
        {
            _db.DepartmentCategories.Add(new DepartmentCategories { DepartmentId = request.DepartmentId, CategoryId = categoryId });
        }

        await _db.SaveChangesAsync(ct);
    }
}
