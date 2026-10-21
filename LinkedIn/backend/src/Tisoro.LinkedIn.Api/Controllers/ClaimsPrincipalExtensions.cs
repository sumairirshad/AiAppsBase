using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Tisoro.LinkedIn.Api.Controllers;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetAdminUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? throw new InvalidOperationException("Authenticated request is missing the sub claim.");
        return Guid.Parse(sub);
    }
}
