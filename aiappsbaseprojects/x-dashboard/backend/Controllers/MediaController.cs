using Microsoft.AspNetCore.Mvc;
using XDashboard.Api.Services.X;

namespace XDashboard.Api.Controllers;

/// <summary>
/// Uploads a file to X via the chunked /2/media/upload flow and returns the resulting media id,
/// which the frontend then attaches to a post or short create call. The access token never
/// leaves the server: the browser sends raw file bytes here, and this controller does the
/// authenticated relay to X.
/// </summary>
[ApiController]
[Route("api/media")]
public class MediaController : ControllerBase
{
    // X API limits (see https://docs.x.com/x-api/media/quickstart/media-upload-chunked):
    // images up to 5MB, video up to 512MB for standard tweet_video uploads.
    private const long MaxImageBytes = 5 * 1024 * 1024;
    private const long MaxVideoBytes = 512 * 1024 * 1024;

    private readonly IXApiClient _xApiClient;

    public MediaController(IXApiClient xApiClient)
    {
        _xApiClient = xApiClient;
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxVideoBytes)]
    public async Task<IActionResult> Upload(IFormFile? file, [FromForm] string? kind, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "A file is required." });
        }

        string mediaCategory;
        switch (kind?.Trim().ToLowerInvariant())
        {
            case "image":
                if (file.Length > MaxImageBytes)
                {
                    return BadRequest(new { message = "Images must be 5MB or smaller (X API limit)." });
                }

                mediaCategory = "tweet_image";
                break;
            case "video":
                if (file.Length > MaxVideoBytes)
                {
                    return BadRequest(new { message = "Videos must be 512MB or smaller (X API limit)." });
                }

                mediaCategory = "tweet_video";
                break;
            default:
                return BadRequest(new { message = "kind must be 'image' or 'video'." });
        }

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream, cancellationToken);
        var bytes = memoryStream.ToArray();

        var mimeType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType;
        var mediaId = await _xApiClient.UploadMediaAsync(bytes, mimeType, mediaCategory, cancellationToken);

        return Ok(new { mediaId });
    }
}
