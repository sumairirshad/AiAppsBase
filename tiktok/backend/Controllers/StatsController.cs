using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TikTok.Api.Models.Dtos;
using TikTok.Api.Security;
using TikTok.Api.Services;

namespace TikTok.Api.Controllers;

[ApiController]
[Route("api/stats")]
[Authorize(AuthenticationSchemes = AdminApiKeyAuthenticationHandler.SchemeName)]
public class StatsController : ControllerBase
{
    private readonly IStatsService _statsService;

    public StatsController(IStatsService statsService)
    {
        _statsService = statsService;
    }

    [HttpGet("accounts/{accountId:guid}/videos")]
    public async Task<ActionResult<IReadOnlyList<VideoStatDto>>> GetVideoStats(Guid accountId, CancellationToken ct)
    {
        var stats = await _statsService.RefreshAndGetStatsAsync(accountId, ct);
        return Ok(stats);
    }
}
