using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Catalog;

// BR-005 / FEAT-003: only OPD can add or change locations.
public record CreateLocationCommand(long ActorUserId, string Code, string Name, string? Address) : IRequest<long>;

public class CreateLocationValidator : AbstractValidator<CreateLocationCommand>
{
    public CreateLocationValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
    }
}

public class CreateLocationHandler : IRequestHandler<CreateLocationCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public CreateLocationHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task<long> Handle(CreateLocationCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "OPD.LOCATIONS", ct);
        if (await _db.Locations.AnyAsync(l => l.Code == request.Code, ct))
            throw new InvalidOperationException($"Location code '{request.Code}' already exists.");

        var location = new Locations { Code = request.Code, Name = request.Name, Address = request.Address, CreatedBy = request.ActorUserId };
        _db.Locations.Add(location);
        await _db.SaveChangesAsync(ct);
        return location.Id;
    }
}

public record UpdateLocationCommand(long ActorUserId, long LocationId, string Name, string? Address, bool IsActive) : IRequest;

public class UpdateLocationHandler : IRequestHandler<UpdateLocationCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public UpdateLocationHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task Handle(UpdateLocationCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "OPD.LOCATIONS", ct);
        var location = await _db.Locations.FirstOrDefaultAsync(l => l.Id == request.LocationId, ct)
            ?? throw new InvalidOperationException("Location not found.");
        location.Name = request.Name;
        location.Address = request.Address;
        location.IsActive = request.IsActive;
        location.UpdatedBy = request.ActorUserId;
        location.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
