using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Admin;

public record UserSummaryDto(long Id, string EmployeeNo, string DisplayName, string Email, long DepartmentId, string DepartmentName, bool IsActive, List<string> RoleCodes);

public record ListUsersQuery : IRequest<List<UserSummaryDto>>;

public class ListUsersQueryHandler : IRequestHandler<ListUsersQuery, List<UserSummaryDto>>
{
    private readonly IProcurementDbContext _db;
    public ListUsersQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<UserSummaryDto>> Handle(ListUsersQuery request, CancellationToken ct)
    {
        var users = await _db.Users.Where(u => u.EmployeeNo != "SYSTEM").ToListAsync(ct);
        var departments = await _db.Departments.ToDictionaryAsync(d => d.Id, ct);
        var assignments = await _db.UserRoleAssignments
            .Join(_db.Roles, a => a.RoleId, r => r.Id, (a, r) => new { a.UserId, r.Code })
            .ToListAsync(ct);

        return users.OrderBy(u => u.DisplayName).Select(u => new UserSummaryDto(
            u.Id, u.EmployeeNo, u.DisplayName, u.Email, u.DepartmentId, departments[u.DepartmentId].Name, u.IsActive,
            assignments.Where(a => a.UserId == u.Id).Select(a => a.Code).Distinct().ToList())).ToList();
    }
}

public record CreateUserCommand(string EmployeeNo, string DisplayName, string Email, long DepartmentId, string Password, string RoleCode, long? RoleDepartmentId) : IRequest<long>;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserContext _currentUser;

    public CreateUserCommandHandler(IProcurementDbContext db, IPasswordHasher passwordHasher, ICurrentUserContext currentUser)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _currentUser = currentUser;
    }

    public async Task<long> Handle(CreateUserCommand request, CancellationToken ct)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email || u.EmployeeNo == request.EmployeeNo, ct))
        {
            throw new ConflictException("A user with this email or employee number already exists.");
        }

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Code == request.RoleCode, ct)
            ?? throw new NotFoundException("Role", request.RoleCode);

        var now = DateTime.UtcNow;
        var user = new Users
        {
            EmployeeNo = request.EmployeeNo,
            DisplayName = request.DisplayName,
            Email = request.Email,
            DepartmentId = request.DepartmentId,
            PasswordHash = _passwordHasher.Hash(request.Password),
            IsActive = true,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        _db.UserRoleAssignments.Add(new UserRoleAssignments
        {
            UserId = user.Id,
            RoleId = role.Id,
            DepartmentId = request.RoleDepartmentId,
            ValidFrom = DateOnly.FromDateTime(now),
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        });

        _db.UserDepartmentAccess.Add(new UserDepartmentAccess
        {
            UserId = user.Id,
            DepartmentId = request.DepartmentId,
            CanRaisePr = true,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        });

        await _db.SaveChangesAsync(ct);
        return user.Id;
    }
}

public record ListRolesQuery : IRequest<List<RoleDto>>;
public record RoleDto(long Id, string Code, string Name);

public class ListRolesQueryHandler : IRequestHandler<ListRolesQuery, List<RoleDto>>
{
    private readonly IProcurementDbContext _db;
    public ListRolesQueryHandler(IProcurementDbContext db) => _db = db;
    public async Task<List<RoleDto>> Handle(ListRolesQuery request, CancellationToken ct) =>
        await _db.Roles.Where(r => r.Code != "SYSTEM").OrderBy(r => r.Name).Select(r => new RoleDto(r.Id, r.Code, r.Name)).ToListAsync(ct);
}
