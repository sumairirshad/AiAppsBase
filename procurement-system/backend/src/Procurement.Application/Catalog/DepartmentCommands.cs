using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Catalog;

public record CreateDepartmentCommand(long ActorUserId, string Code, string Name, long? ParentId) : IRequest<long>;

public class CreateDepartmentValidator : AbstractValidator<CreateDepartmentCommand>
{
    public CreateDepartmentValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
    }
}

public class CreateDepartmentHandler : IRequestHandler<CreateDepartmentCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public CreateDepartmentHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task<long> Handle(CreateDepartmentCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "OPD.USERS", ct);
        if (await _db.Departments.AnyAsync(d => d.Code == request.Code, ct))
            throw new InvalidOperationException($"Department code '{request.Code}' already exists.");

        var dept = new Departments { Code = request.Code, Name = request.Name, ParentId = request.ParentId, CreatedBy = request.ActorUserId };
        _db.Departments.Add(dept);
        await _db.SaveChangesAsync(ct);
        return dept.Id;
    }
}

public record GrantDepartmentAccessCommand(long ActorUserId, long UserId, long DepartmentId) : IRequest;

public class GrantDepartmentAccessHandler : IRequestHandler<GrantDepartmentAccessCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public GrantDepartmentAccessHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task Handle(GrantDepartmentAccessCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "OPD.USERS", ct);
        var exists = await _db.UserDepartmentAccess.AnyAsync(a => a.UserId == request.UserId && a.DepartmentId == request.DepartmentId, ct);
        if (exists) return;
        _db.UserDepartmentAccess.Add(new UserDepartmentAccess { UserId = request.UserId, DepartmentId = request.DepartmentId, CreatedBy = request.ActorUserId });
        await _db.SaveChangesAsync(ct);
    }
}

public record AssignRoleCommand(long ActorUserId, long UserId, string RoleCode, long? DepartmentId) : IRequest;

public class AssignRoleHandler : IRequestHandler<AssignRoleCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public AssignRoleHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task Handle(AssignRoleCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "ADMIN.USERS", ct);
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Code == request.RoleCode, ct)
            ?? throw new InvalidOperationException($"No role '{request.RoleCode}'.");

        var exists = await _db.UserRoleAssignments.AnyAsync(
            a => a.UserId == request.UserId && a.RoleId == role.Id && a.DepartmentId == request.DepartmentId, ct);
        if (exists) return;

        _db.UserRoleAssignments.Add(new UserRoleAssignments
        {
            UserId = request.UserId,
            RoleId = role.Id,
            DepartmentId = request.DepartmentId,
            ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow),
            CreatedBy = request.ActorUserId,
        });
        await _db.SaveChangesAsync(ct);
    }
}
