using Instagram.Api.Clients;
using Instagram.Api.Models.Requests;
using Instagram.Api.Security;
using Instagram.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instagram.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    IInstagramGraphClient graphClient,
    IOAuthStateService stateService,
    IAccountService accountService) : ControllerBase
{
    [HttpGet("connect")]
    public IActionResult Connect()
    {
        var handshake = stateService.CreateHandshake();
        var url = graphClient.BuildAuthorizationUrl(handshake.State, handshake.CodeChallenge);
        return Ok(new { authorizationUrl = url, state = handshake.State });
    }

    [HttpPost("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromBody] CompleteConnectionRequest request, CancellationToken ct)
    {
        if (!stateService.TryConsume(request.State, out var codeVerifier))
        {
            return BadRequest(new { message = "Invalid or expired OAuth state. Restart the connection flow." });
        }

        var account = await accountService.CompleteConnectionAsync(request.Code, codeVerifier, ct);
        return Ok(account);
    }
}
