using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TikTok.Api.Configuration;
using TikTok.Api.Models.Dtos;
using TikTok.Api.Security;
using TikTok.Api.Services;
using Microsoft.Extensions.Options;

namespace TikTok.Api.Controllers;

[ApiController]
[Route("api/accounts")]
[Authorize(AuthenticationSchemes = AdminApiKeyAuthenticationHandler.SchemeName)]
public class AccountsController : ControllerBase
{
    private readonly IAccountConnectionService _accountService;
    private readonly CorsOptions _corsOptions;

    public AccountsController(IAccountConnectionService accountService, IOptions<CorsOptions> corsOptions)
    {
        _accountService = accountService;
        _corsOptions = corsOptions.Value;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ConnectedAccountDto>>> List(CancellationToken ct)
    {
        return Ok(await _accountService.ListAccountsAsync(ct));
    }

    [HttpGet("connect")]
    public ActionResult<ConnectAuthorizeResponse> Connect()
    {
        var url = _accountService.BuildAuthorizationUrl(out _);
        return Ok(new ConnectAuthorizeResponse(url));
    }

    [HttpGet("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromQuery] string code, [FromQuery] string state, [FromQuery] string? error, CancellationToken ct)
    {
        var frontendBase = _corsOptions.AllowedOrigins.FirstOrDefault() ?? string.Empty;

        if (!string.IsNullOrEmpty(error))
        {
            return Redirect($"{frontendBase}/connect?status=error&reason={Uri.EscapeDataString(error)}");
        }

        try
        {
            var account = await _accountService.HandleCallbackAsync(code, state, ct);
            return Redirect($"{frontendBase}/connect?status=success&accountId={account.Id}");
        }
        catch (Exception ex)
        {
            return Redirect($"{frontendBase}/connect?status=error&reason={Uri.EscapeDataString(ex.Message)}");
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Disconnect(Guid id, CancellationToken ct)
    {
        await _accountService.DisconnectAsync(id, ct);
        return NoContent();
    }
}
