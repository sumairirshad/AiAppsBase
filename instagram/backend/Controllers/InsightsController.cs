using Instagram.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instagram.Api.Controllers;

[ApiController]
[Route("api/insights")]
[Authorize]
public class InsightsController(IInsightsService insightsService) : ControllerBase
{
    [HttpPost("accounts/{accountId:guid}/sync")]
    public async Task<IActionResult> SyncAccountInsights(Guid accountId, CancellationToken ct) =>
        Ok(await insightsService.SyncAndGetAccountInsightsAsync(accountId, ct));

    [HttpGet("media/{mediaId}")]
    public async Task<IActionResult> GetMediaInsights(
        string mediaId, [FromQuery] Guid accountId, CancellationToken ct) =>
        Ok(await insightsService.GetMediaInsightsAsync(accountId, mediaId, ct));
}
