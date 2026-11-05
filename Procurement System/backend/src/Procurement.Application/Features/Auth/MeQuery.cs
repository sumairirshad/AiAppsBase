using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Features.Auth;

public record MeQuery : IRequest<UserDto>;

public class MeQueryHandler : IRequestHandler<MeQuery, UserDto>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;

    public MeQueryHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<UserDto> Handle(MeQuery request, CancellationToken cancellationToken)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == _currentUser.UserId, cancellationToken)
            ?? throw new NotFoundException("User", _currentUser.UserId);
        return await UserDtoBuilder.BuildAsync(_db, user, cancellationToken);
    }
}
