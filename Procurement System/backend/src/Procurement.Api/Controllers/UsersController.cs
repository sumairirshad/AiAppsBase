using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Api.Authorization;
using Procurement.Application.Features.Admin;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ISender _sender;
    public UsersController(ISender sender) => _sender = sender;

    [HttpGet("api/v1/users")]
    [RequirePermission("ADMIN.USERS")]
    public async Task<ActionResult<List<UserSummaryDto>>> List(CancellationToken ct) => Ok(await _sender.Send(new ListUsersQuery(), ct));

    [HttpPost("api/v1/users")]
    [RequirePermission("ADMIN.USERS")]
    public async Task<ActionResult<long>> Create(CreateUserCommand command, CancellationToken ct) => Ok(await _sender.Send(command, ct));

    [HttpGet("api/v1/roles")]
    [RequirePermission("ADMIN.ROLES")]
    public async Task<ActionResult<List<RoleDto>>> ListRoles(CancellationToken ct) => Ok(await _sender.Send(new ListRolesQuery(), ct));
}
