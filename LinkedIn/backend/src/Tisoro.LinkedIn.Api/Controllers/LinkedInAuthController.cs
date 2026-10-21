using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Tisoro.LinkedIn.Api.Configuration;
using Tisoro.LinkedIn.Api.Data;
using Tisoro.LinkedIn.Api.Dtos;
using Tisoro.LinkedIn.Api.Models;
using Tisoro.LinkedIn.Api.Services;
using Tisoro.LinkedIn.Api.Services.LinkedIn;

namespace Tisoro.LinkedIn.Api.Controllers;

[ApiController]
[Route("api/linkedin")]
public sealed class LinkedInAuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILinkedInOAuthService _oauthService;
    private readonly ITokenEncryptionService _tokenEncryption;
    private readonly GeneralOptions _generalOptions;
    private readonly ILogger<LinkedInAuthController> _logger;

    public LinkedInAuthController(
        AppDbContext db,
        ILinkedInOAuthService oauthService,
        ITokenEncryptionService tokenEncryption,
        IOptions<GeneralOptions> generalOptions,
        ILogger<LinkedInAuthController> logger)
    {
        _db = db;
        _oauthService = oauthService;
        _tokenEncryption = tokenEncryption;
        _generalOptions = generalOptions.Value;
        _logger = logger;
    }

    /// <summary>Starts the connect flow: issues a CSRF state tied to the signed-in admin and returns the LinkedIn authorize URL to redirect the browser to.</summary>
    [Authorize]
    [HttpGet("connect")]
    public async Task<ActionResult<LinkedInConnectUrlResponse>> Connect()
    {
        var adminUserId = User.GetAdminUserId();

        var state = Convert.ToHexString(RandomNumberGenerator.GetBytes(24));
        _db.OAuthStates.Add(new OAuthState
        {
            Id = Guid.NewGuid(),
            State = state,
            AdminUserId = adminUserId,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(10),
        });
        await _db.SaveChangesAsync();

        return Ok(new LinkedInConnectUrlResponse { AuthorizeUrl = _oauthService.BuildAuthorizeUrl(state) });
    }

    /// <summary>
    /// LinkedIn redirects the browser here directly (no JWT present). The
    /// `state` value is what ties this request back to the admin who
    /// initiated it and rules out a forged or replayed callback.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string? code, [FromQuery] string? state, [FromQuery] string? error)
    {
        if (!string.IsNullOrEmpty(error))
        {
            _logger.LogWarning("LinkedIn OAuth callback returned an error: {Error}", error);
            return Redirect($"{_generalOptions.FrontendBaseUrl}/settings/linkedin?error={Uri.EscapeDataString(error)}");
        }

        if (string.IsNullOrEmpty(code) || string.IsNullOrEmpty(state))
        {
            return Redirect($"{_generalOptions.FrontendBaseUrl}/settings/linkedin?error=missing_code_or_state");
        }

        var stateRow = await _db.OAuthStates.FirstOrDefaultAsync(s => s.State == state);
        if (stateRow is null || stateRow.Consumed || stateRow.ExpiresAt < DateTimeOffset.UtcNow)
        {
            _logger.LogWarning("LinkedIn OAuth callback with invalid/expired/replayed state");
            return Redirect($"{_generalOptions.FrontendBaseUrl}/settings/linkedin?error=invalid_state");
        }
        stateRow.Consumed = true;

        var admin = await _db.AdminUsers.FindAsync(stateRow.AdminUserId);
        if (admin is null)
        {
            return Redirect($"{_generalOptions.FrontendBaseUrl}/settings/linkedin?error=admin_not_found");
        }

        try
        {
            var tokenResponse = await _oauthService.ExchangeCodeAsync(code);
            var organizations = await _oauthService.GetAdministeredOrganizationsAsync(tokenResponse.AccessToken);
            var org = organizations.FirstOrDefault();

            if (org is null)
            {
                _logger.LogWarning("LinkedIn account {Email} administers no organizations with the required role", admin.Email);
                await _db.SaveChangesAsync();
                return Redirect($"{_generalOptions.FrontendBaseUrl}/settings/linkedin?error=no_administered_organization");
            }

            var userInfo = await _oauthService.GetUserInfoAsync(tokenResponse.AccessToken);

            // Only one active connection is used at a time (single Tisoro Page).
            var existing = await _db.LinkedInConnections.Where(c => c.IsActive).ToListAsync();
            foreach (var old in existing) old.IsActive = false;

            _db.LinkedInConnections.Add(new LinkedInConnection
            {
                Id = Guid.NewGuid(),
                OrganizationUrn = org.OrganizationUrn,
                OrganizationName = org.OrganizationName ?? "",
                MemberUrn = $"urn:li:person:{userInfo.Sub}",
                ConnectedByAdminEmail = admin.Email,
                AccessTokenEncrypted = _tokenEncryption.Encrypt(tokenResponse.AccessToken),
                RefreshTokenEncrypted = tokenResponse.RefreshToken is null ? null : _tokenEncryption.Encrypt(tokenResponse.RefreshToken),
                Scopes = tokenResponse.Scope ?? "",
                AccessTokenExpiresAt = DateTimeOffset.UtcNow.AddSeconds(tokenResponse.ExpiresInSeconds),
                RefreshTokenExpiresAt = tokenResponse.RefreshTokenExpiresInSeconds is { } seconds
                    ? DateTimeOffset.UtcNow.AddSeconds(seconds)
                    : null,
                IsActive = true,
            });

            await _db.SaveChangesAsync();
            _logger.LogInformation("LinkedIn connected: organization {OrgUrn} by {Email}", org.OrganizationUrn, admin.Email);

            return Redirect($"{_generalOptions.FrontendBaseUrl}/settings/linkedin?connected=1");
        }
        catch (LinkedInApiException ex)
        {
            _logger.LogError(ex, "LinkedIn OAuth callback failed");
            await _db.SaveChangesAsync();
            return Redirect($"{_generalOptions.FrontendBaseUrl}/settings/linkedin?error=linkedin_api_error");
        }
    }

    [Authorize]
    [HttpGet("status")]
    public async Task<ActionResult<LinkedInStatusResponse>> Status()
    {
        var connection = await _db.LinkedInConnections
            .Where(c => c.IsActive)
            .OrderByDescending(c => c.ConnectedAt)
            .FirstOrDefaultAsync();

        if (connection is null)
        {
            return Ok(new LinkedInStatusResponse { Connected = false });
        }

        return Ok(new LinkedInStatusResponse
        {
            Connected = true,
            OrganizationName = connection.OrganizationName,
            OrganizationUrn = connection.OrganizationUrn,
            ConnectedByAdminEmail = connection.ConnectedByAdminEmail,
            ConnectedAt = connection.ConnectedAt,
            AccessTokenExpiresAt = connection.AccessTokenExpiresAt,
            TokenExpired = connection.AccessTokenExpiresAt <= DateTimeOffset.UtcNow,
        });
    }

    [Authorize]
    [HttpPost("disconnect")]
    public async Task<IActionResult> Disconnect()
    {
        var active = await _db.LinkedInConnections.Where(c => c.IsActive).ToListAsync();
        foreach (var c in active) c.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

}
