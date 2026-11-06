using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Catalog;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Identity.Accounts;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/admin")]
public class AdminController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public AdminController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<UserDto>>> Users(CancellationToken ct) => await _mediator.Send(new ListUsersQuery(), ct);

    [HttpPost("users")]
    public async Task<ActionResult<long>> CreateUser(CreateUserRequest body, CancellationToken ct) =>
        await _mediator.Send(new CreateUserCommand(_currentUser.UserId, body.EmployeeNo, body.DisplayName, body.Email, body.DepartmentId, body.Password), ct);

    [HttpPost("users/{userId:long}/roles")]
    public async Task<IActionResult> AssignRole(long userId, AssignRoleRequest body, CancellationToken ct)
    {
        await _mediator.Send(new AssignRoleCommand(_currentUser.UserId, userId, body.RoleCode, body.DepartmentId), ct);
        return NoContent();
    }

    [HttpPost("users/{userId:long}/department-access")]
    public async Task<IActionResult> GrantDepartmentAccess(long userId, GrantAccessRequest body, CancellationToken ct)
    {
        await _mediator.Send(new GrantDepartmentAccessCommand(_currentUser.UserId, userId, body.DepartmentId), ct);
        return NoContent();
    }
}

public record CreateUserRequest(string EmployeeNo, string DisplayName, string Email, long DepartmentId, string Password);
public record AssignRoleRequest(string RoleCode, long? DepartmentId);
public record GrantAccessRequest(long DepartmentId);
