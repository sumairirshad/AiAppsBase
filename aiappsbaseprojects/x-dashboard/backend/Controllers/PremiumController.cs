using Microsoft.AspNetCore.Mvc;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Controllers;

[ApiController]
[Route("api/premium")]
public class PremiumController : ControllerBase
{
    private readonly IPremiumStatusProvider _premiumStatusProvider;

    public PremiumController(IPremiumStatusProvider premiumStatusProvider)
    {
        _premiumStatusProvider = premiumStatusProvider;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(CancellationToken cancellationToken)
    {
        var status = await _premiumStatusProvider.GetStatusAsync(cancellationToken);
        return Ok(status);
    }
}
