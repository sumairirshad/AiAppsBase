using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Identity.Auth;

namespace Procurement.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResult>> Login(LoginCommand command, CancellationToken ct)
    {
        try
        {
            return Ok(await _mediator.Send(command, ct));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<object>> Me([FromServices] ICurrentUserService currentUser, [FromServices] UserAccessService access, [FromServices] IApplicationDbContext db, CancellationToken ct)
    {
        var user = await db.Users.FindAsync(new object[] { currentUser.UserId }, ct);
        if (user is null) return NotFound();
        var assignments = await access.GetAssignmentsAsync(currentUser.UserId, ct);
        return Ok(new { user.Id, user.DisplayName, user.Email, user.DepartmentId, Roles = assignments });
    }
}
