using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Admin;

public record LocationDto(long Id, string Code, string Name, string? Address, bool IsActive);

public record ListLocationsQuery : IRequest<List<LocationDto>>;

public class ListLocationsQueryHandler : IRequestHandler<ListLocationsQuery, List<LocationDto>>
{
    private readonly IProcurementDbContext _db;
    public ListLocationsQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<LocationDto>> Handle(ListLocationsQuery request, CancellationToken ct) =>
        await _db.Locations.OrderBy(l => l.Name)
            .Select(l => new LocationDto(l.Id, l.Code, l.Name, l.Address, l.IsActive))
            .ToListAsync(ct);
}

public record CreateLocationCommand(string Code, string Name, string? Address) : IRequest<long>;

public class CreateLocationCommandHandler : IRequestHandler<CreateLocationCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    public CreateLocationCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<long> Handle(CreateLocationCommand request, CancellationToken ct)
    {
        if (await _db.Locations.AnyAsync(l => l.Code == request.Code, ct))
        {
            throw new ConflictException($"Location code '{request.Code}' already exists.");
        }

        var location = new Locations
        {
            Code = request.Code, Name = request.Name, Address = request.Address, IsActive = true,
            CreatedByUserId = _currentUser.UserId, CreatedAt = DateTime.UtcNow,
        };
        _db.Locations.Add(location);
        await _db.SaveChangesAsync(ct);
        return location.Id;
    }
}

public record UpdateLocationCommand(long Id, string Name, string? Address, bool IsActive) : IRequest;

public class UpdateLocationCommandHandler : IRequestHandler<UpdateLocationCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    public UpdateLocationCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(UpdateLocationCommand request, CancellationToken ct)
    {
        var location = await _db.Locations.FirstOrDefaultAsync(l => l.Id == request.Id, ct)
            ?? throw new NotFoundException("Location", request.Id);

        location.Name = request.Name;
        location.Address = request.Address;
        location.IsActive = request.IsActive;
        location.UpdatedByUserId = _currentUser.UserId;
        location.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}
