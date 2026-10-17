using Microsoft.AspNetCore.Mvc;
using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Controllers;

[ApiController]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly IProfileStore _profileStore;

    public ProfileController(IProfileStore profileStore)
    {
        _profileStore = profileStore;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var profile = await _profileStore.GetProfileAsync(cancellationToken);
        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            return BadRequest(new { message = "Display name is required." });
        }

        if (request.Bio.Length > 160)
        {
            return BadRequest(new { message = "Bio must be 160 characters or fewer." });
        }

        var updated = await _profileStore.UpdateProfileAsync(request, cancellationToken);
        return Ok(updated);
    }
}
