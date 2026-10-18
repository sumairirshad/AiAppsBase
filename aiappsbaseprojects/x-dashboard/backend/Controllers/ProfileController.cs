using Microsoft.AspNetCore.Mvc;
using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;
using XDashboard.Api.Services.X;

namespace XDashboard.Api.Controllers;

[ApiController]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private const long MaxImageBytes = 5 * 1024 * 1024;

    private readonly IProfileStore _profileStore;
    private readonly IXApiClient _xApiClient;

    public ProfileController(IProfileStore profileStore, IXApiClient xApiClient)
    {
        _profileStore = profileStore;
        _xApiClient = xApiClient;
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

    /// <summary>Relays raw image bytes to the legacy v1.1 account/update_profile_image
    /// endpoint. There is no v2 equivalent, and no way to set a profile picture by URL --
    /// X requires the actual image bytes.</summary>
    [HttpPost("picture")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxImageBytes)]
    public async Task<IActionResult> UpdatePicture(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "An image file is required." });
        }

        if (file.Length > MaxImageBytes)
        {
            return BadRequest(new { message = "Profile images must be 5MB or smaller." });
        }

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream, cancellationToken);
        var url = await _xApiClient.UpdateProfileImageAsync(
            memoryStream.ToArray(),
            string.IsNullOrWhiteSpace(file.ContentType) ? "image/jpeg" : file.ContentType,
            cancellationToken);

        return Ok(new { profilePictureUrl = url });
    }

    /// <summary>Relays raw image bytes to the legacy v1.1 account/update_profile_banner
    /// endpoint. There is no v2 equivalent.</summary>
    [HttpPost("banner")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxImageBytes)]
    public async Task<IActionResult> UpdateBanner(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "An image file is required." });
        }

        if (file.Length > MaxImageBytes)
        {
            return BadRequest(new { message = "Cover images must be 5MB or smaller." });
        }

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream, cancellationToken);
        var url = await _xApiClient.UpdateProfileBannerAsync(
            memoryStream.ToArray(),
            string.IsNullOrWhiteSpace(file.ContentType) ? "image/jpeg" : file.ContentType,
            cancellationToken);

        return Ok(new { coverImageUrl = url });
    }
}
