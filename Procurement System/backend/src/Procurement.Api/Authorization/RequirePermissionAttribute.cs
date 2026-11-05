using Microsoft.AspNetCore.Mvc.Filters;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Api.Authorization;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequirePermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _permissionCode;

    public RequirePermissionAttribute(string permissionCode) => _permissionCode = permissionCode;

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        if (context.HttpContext.User.Identity?.IsAuthenticated != true)
        {
            context.Result = new Microsoft.AspNetCore.Mvc.UnauthorizedResult();
            return;
        }

        var currentUser = context.HttpContext.RequestServices.GetRequiredService<ICurrentUserContext>();
        if (!await currentUser.HasPermissionAsync(_permissionCode))
        {
            context.Result = new Microsoft.AspNetCore.Mvc.ForbidResult();
        }
    }
}
