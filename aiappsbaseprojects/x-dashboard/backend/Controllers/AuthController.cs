using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using XDashboard.Api.Options;
using XDashboard.Api.Services.X;

namespace XDashboard.Api.Controllers;

/// <summary>
/// Drives the X API v2 OAuth 2.0 Authorization Code + PKCE flow. The client secret and the
/// resulting access/refresh tokens never reach the browser: the frontend only ever sees whether
/// a connection exists (<see cref="GetStatus"/>) via a full-page redirect through this
/// controller, not a fetch call, since steps 1 and 2 of the flow happen on x.com itself.
/// </summary>
[ApiController]
[Route("api/auth/x")]
public class AuthController : ControllerBase
{
    private readonly IXOAuthService _oAuthService;
    private readonly ITokenStore _tokenStore;
    private readonly IXApiClient _xApiClient;
    private readonly FrontendOptions _frontendOptions;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IXOAuthService oAuthService,
        ITokenStore tokenStore,
        IXApiClient xApiClient,
        IOptions<FrontendOptions> frontendOptions,
        ILogger<AuthController> logger)
    {
        _oAuthService = oAuthService;
        _tokenStore = tokenStore;
        _xApiClient = xApiClient;
        _frontendOptions = frontendOptions.Value;
        _logger = logger;
    }

    [HttpGet("login")]
    public IActionResult Login()
    {
        try
        {
            var authorization = _oAuthService.BeginAuthorization();
            return Redirect(authorization.AuthorizeUrl);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = ex.Message, code = "x_not_configured" });
        }
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error,
        [FromQuery(Name = "error_description")] string? errorDescription,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(error))
        {
            return RedirectToFrontend(connected: false, error: errorDescription ?? error);
        }

        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
        {
            return RedirectToFrontend(connected: false, error: "X did not return an authorization code.");
        }

        try
        {
            var tokens = await _oAuthService.CompleteAuthorizationAsync(code, state, cancellationToken);
            await _tokenStore.SaveAsync(tokens, cancellationToken);
            return RedirectToFrontend(connected: true);
        }
        catch (Exception ex) when (ex is InvalidOperationException or XApiException)
        {
            _logger.LogWarning(ex, "X OAuth callback failed");
            return RedirectToFrontend(connected: false, error: ex.Message);
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(CancellationToken cancellationToken)
    {
        var tokens = await _tokenStore.GetAsync(cancellationToken);
        if (tokens is null)
        {
            return Ok(new { connected = false });
        }

        try
        {
            var me = await _xApiClient.GetMeAsync(cancellationToken);
            return Ok(new
            {
                connected = true,
                handle = me.Username,
                displayName = me.Name,
                profileImageUrl = me.ProfileImageUrl,
            });
        }
        catch (XNotConnectedException)
        {
            return Ok(new { connected = false });
        }
        catch (XApiException ex)
        {
            // We do have tokens, but X is rejecting or erroring on the lookup itself (rate
            // limited, X outage, etc). Report "connected" (so the UI doesn't show a stale
            // "connect" button loop) alongside the real error for visibility.
            return Ok(new { connected = true, error = ex.Message, rateLimited = ex.IsRateLimited });
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var tokens = await _tokenStore.GetAsync(cancellationToken);
        if (tokens is not null)
        {
            await _oAuthService.RevokeAsync(tokens.AccessToken, cancellationToken);
        }

        await _tokenStore.ClearAsync(cancellationToken);
        return NoContent();
    }

    private IActionResult RedirectToFrontend(bool connected, string? error = null)
    {
        var target = $"{_frontendOptions.BaseUrl.TrimEnd('/')}/profile?x_connected={(connected ? "1" : "0")}";
        if (!string.IsNullOrEmpty(error))
        {
            target += $"&x_error={Uri.EscapeDataString(error)}";
        }

        return Redirect(target);
    }
}
