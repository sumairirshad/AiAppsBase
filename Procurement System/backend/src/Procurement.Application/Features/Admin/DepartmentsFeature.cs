using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Admin;

public record DepartmentDto(long Id, string Code, string Name, long? ParentId, string? ParentName, long? HodUserId, string? HodUserName, bool IsActive);

public record ListDepartmentsQuery : IRequest<List<DepartmentDto>>;

public class ListDepartmentsQueryHandler : IRequestHandler<ListDepartmentsQuery, List<DepartmentDto>>
{
    private readonly IProcurementDbContext _db;
    public ListDepartmentsQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<DepartmentDto>> Handle(ListDepartmentsQuery request, CancellationToken ct)
    {
        var departments = await _db.Departments.ToListAsync(ct);
        var users = await _db.Users.ToDictionaryAsync(u => u.Id, ct);
        var byId = departments.ToDictionary(d => d.Id);

        return departments
            .Where(d => d.Code != "SYS")
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentDto(
                d.Id, d.Code, d.Name,
                d.ParentId, d.ParentId != null && byId.TryGetValue(d.ParentId.Value, out var p) ? p.Name : null,
                d.HodUserId, d.HodUserId != null && users.TryGetValue(d.HodUserId.Value, out var u) ? u.DisplayName : null,
                d.IsActive))
            .ToList();
    }
}

public record CreateDepartmentCommand(string Code, string Name, long? ParentId) : IRequest<long>;

public class CreateDepartmentCommandHandler : IRequestHandler<CreateDepartmentCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    public CreateDepartmentCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<long> Handle(CreateDepartmentCommand request, CancellationToken ct)
    {
        if (await _db.Departments.AnyAsync(d => d.Code == request.Code, ct))
        {
            throw new ConflictException($"Department code '{request.Code}' already exists.");
        }

        var department = new Departments
        {
            Code = request.Code,
            Name = request.Name,
            ParentId = request.ParentId,
            IsActive = true,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Departments.Add(department);
        await _db.SaveChangesAsync(ct);
        return department.Id;
    }
}

public record UpdateDepartmentCommand(long Id, string Name, long? ParentId, long? HodUserId, bool IsActive) : IRequest;

public class UpdateDepartmentCommandHandler : IRequestHandler<UpdateDepartmentCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    public UpdateDepartmentCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(UpdateDepartmentCommand request, CancellationToken ct)
    {
        var department = await _db.Departments.FirstOrDefaultAsync(d => d.Id == request.Id, ct)
            ?? throw new NotFoundException("Department", request.Id);

        department.Name = request.Name;
        department.ParentId = request.ParentId;
        department.HodUserId = request.HodUserId;
        department.IsActive = request.IsActive;
        department.UpdatedByUserId = _currentUser.UserId;
        department.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}
