using System.IdentityModel.Tokens.Jwt;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    public long UserId { get; }
    public bool IsAuthenticated { get; }

    public CurrentUserService(IHttpContextAccessor accessor)
    {
        var sub = accessor.HttpContext?.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        IsAuthenticated = sub is not null;
        UserId = sub is not null && long.TryParse(sub, out var id) ? id : 0;
    }
}
