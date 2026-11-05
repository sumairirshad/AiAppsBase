using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Features.Auth;

namespace Procurement.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly ISender _sender;

    public AuthController(ISender sender) => _sender = sender;

    public record LoginRequest(string Email, string Password);

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResult>> Login(LoginRequest request, CancellationToken ct)
    {
        var result = await _sender.Send(new LoginCommand(request.Email, request.Password), ct);
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
    {
        var result = await _sender.Send(new MeQuery(), ct);
        return Ok(result);
    }
}
