using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Identity.Accounts;

// BR-001: every user must have a department; mandatory, enforced here rather than left nullable.
public record CreateUserCommand(long ActorUserId, string EmployeeNo, string DisplayName, string Email, long DepartmentId, string Password) : IRequest<long>;

public class CreateUserValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.EmployeeNo).NotEmpty();
        RuleFor(x => x.DisplayName).NotEmpty();
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).MinimumLength(8);
    }
}

public class CreateUserHandler : IRequestHandler<CreateUserCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly IPasswordHasher _hasher;

    public CreateUserHandler(IApplicationDbContext db, IPermissionChecker permissions, IPasswordHasher hasher)
    {
        _db = db;
        _permissions = permissions;
        _hasher = hasher;
    }

    public async Task<long> Handle(CreateUserCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "ADMIN.USERS", ct);
        if (await _db.Users.AnyAsync(u => u.Email == request.Email, ct))
            throw new InvalidOperationException($"Email '{request.Email}' is already registered.");

        var user = new Users
        {
            EmployeeNo = request.EmployeeNo,
            DisplayName = request.DisplayName,
            Email = request.Email,
            DepartmentId = request.DepartmentId,
            PasswordHash = _hasher.Hash(request.Password),
            CreatedBy = request.ActorUserId,
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return user.Id;
    }
}

public record UserDto(long Id, string EmployeeNo, string DisplayName, string Email, long DepartmentId, bool IsActive);
public record ListUsersQuery : IRequest<List<UserDto>>;

public class ListUsersHandler : IRequestHandler<ListUsersQuery, List<UserDto>>
{
    private readonly IApplicationDbContext _db;
    public ListUsersHandler(IApplicationDbContext db) => _db = db;

    public async Task<List<UserDto>> Handle(ListUsersQuery request, CancellationToken ct) =>
        await _db.Users.OrderBy(u => u.DisplayName)
            .Select(u => new UserDto(u.Id, u.EmployeeNo, u.DisplayName, u.Email, u.DepartmentId, u.IsActive))
            .ToListAsync(ct);
}
