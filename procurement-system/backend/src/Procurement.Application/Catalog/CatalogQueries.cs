using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Catalog;

public record DepartmentDto(long Id, string Code, string Name, long? ParentId, bool IsActive);
public record LocationDto(long Id, string Code, string Name, string? Address, bool IsActive);
public record CategoryDto(long Id, string Code, string Name, long? ParentId);
public record ItemDto(long Id, string Code, string Name, long CategoryId, long UnitId, string UnitCode);
public record UnitDto(long Id, string Code, string Name);
public record ProjectDto(long Id, string ProjectCode, string Name, long OwnerDepartmentId, bool ContractProvided);

public record ListDepartmentsQuery : IRequest<List<DepartmentDto>>;
public record ListLocationsQuery : IRequest<List<LocationDto>>;
public record ListCategoriesQuery : IRequest<List<CategoryDto>>;
public record ListUnitsQuery : IRequest<List<UnitDto>>;
public record ListProjectsQuery : IRequest<List<ProjectDto>>;

// BR-002/004: items (and therefore vendor suggestions) are scoped to the categories the
// given department may buy in - OPD exempt, handled by the caller passing null departmentId.
public record ListItemsQuery(long? DepartmentId, long? CategoryId) : IRequest<List<ItemDto>>;

public class CatalogQueryHandlers :
    IRequestHandler<ListDepartmentsQuery, List<DepartmentDto>>,
    IRequestHandler<ListLocationsQuery, List<LocationDto>>,
    IRequestHandler<ListCategoriesQuery, List<CategoryDto>>,
    IRequestHandler<ListUnitsQuery, List<UnitDto>>,
    IRequestHandler<ListProjectsQuery, List<ProjectDto>>,
    IRequestHandler<ListItemsQuery, List<ItemDto>>
{
    private readonly IApplicationDbContext _db;

    public CatalogQueryHandlers(IApplicationDbContext db) => _db = db;

    public async Task<List<DepartmentDto>> Handle(ListDepartmentsQuery request, CancellationToken ct) =>
        await _db.Departments.Where(d => d.IsActive).OrderBy(d => d.Name)
            .Select(d => new DepartmentDto(d.Id, d.Code, d.Name, d.ParentId, d.IsActive)).ToListAsync(ct);

    public async Task<List<LocationDto>> Handle(ListLocationsQuery request, CancellationToken ct) =>
        await _db.Locations.Where(l => l.IsActive).OrderBy(l => l.Name)
            .Select(l => new LocationDto(l.Id, l.Code, l.Name, l.Address, l.IsActive)).ToListAsync(ct);

    public async Task<List<CategoryDto>> Handle(ListCategoriesQuery request, CancellationToken ct) =>
        await _db.Categories.Where(c => c.IsActive).OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Code, c.Name, c.ParentId)).ToListAsync(ct);

    public async Task<List<UnitDto>> Handle(ListUnitsQuery request, CancellationToken ct) =>
        await _db.Set<Domain.Entities.Units>().OrderBy(u => u.Name)
            .Select(u => new UnitDto(u.Id, u.Code, u.Name)).ToListAsync(ct);

    public async Task<List<ProjectDto>> Handle(ListProjectsQuery request, CancellationToken ct) =>
        await _db.Set<Domain.Entities.Projects>().Where(p => p.IsActive).OrderBy(p => p.Name)
            .Select(p => new ProjectDto(p.Id, p.ProjectCode, p.Name, p.OwnerDepartmentId, p.ContractProvided)).ToListAsync(ct);

    public async Task<List<ItemDto>> Handle(ListItemsQuery request, CancellationToken ct)
    {
        var allowedCategoryIds = request.DepartmentId is null
            ? null
            : await _db.DepartmentCategories.Where(dc => dc.DepartmentId == request.DepartmentId).Select(dc => dc.CategoryId).ToListAsync(ct);

        var query = _db.Items.Where(i => i.IsActive);
        if (request.CategoryId is not null) query = query.Where(i => i.CategoryId == request.CategoryId);
        if (allowedCategoryIds is not null) query = query.Where(i => allowedCategoryIds.Contains(i.CategoryId));

        return await query.Join(_db.Set<Domain.Entities.Units>(), i => i.UnitId, u => u.Id,
                (i, u) => new ItemDto(i.Id, i.Code, i.Name, i.CategoryId, i.UnitId, u.Code))
            .OrderBy(i => i.Name).ToListAsync(ct);
    }
}
