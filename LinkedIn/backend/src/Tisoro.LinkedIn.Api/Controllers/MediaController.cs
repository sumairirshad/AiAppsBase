using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Tisoro.LinkedIn.Api.Configuration;
using Tisoro.LinkedIn.Api.Data;
using Tisoro.LinkedIn.Api.Dtos;
using Tisoro.LinkedIn.Api.Models;

namespace Tisoro.LinkedIn.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/media")]
public sealed class MediaController : ControllerBase
{
    private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/gif", "image/webp",
    };
    private static readonly HashSet<string> AllowedVideoContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "video/mp4", "video/quicktime",
    };
    private static readonly HashSet<string> AllowedDocumentContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
    };

    private readonly AppDbContext _db;
    private readonly MediaStorageOptions _options;
    private readonly ILogger<MediaController> _logger;

    public MediaController(AppDbContext db, IOptions<MediaStorageOptions> options, ILogger<MediaController> logger)
    {
        _db = db;
        _options = options.Value;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<MediaAssetResponse>>> List([FromQuery] MediaKind? kind)
    {
        var query = _db.MediaAssets.AsQueryable();
        if (kind is not null) query = query.Where(m => m.Kind == kind);
        var assets = await query.OrderByDescending(m => m.UploadedAt).ToListAsync();
        return Ok(assets.Select(MediaAssetResponse.FromEntity).ToList());
    }

    [HttpPost("upload")]
    [RequestSizeLimit(600L * 1024 * 1024)]
    public async Task<ActionResult<MediaAssetResponse>> Upload([FromForm] IFormFile file, [FromForm] MediaKind kind)
    {
        if (file.Length == 0)
        {
            return BadRequest(new { error = "The uploaded file is empty." });
        }
        if (file.Length > _options.MaxUploadBytes)
        {
            return BadRequest(new { error = $"The file exceeds the maximum upload size of {_options.MaxUploadBytes / (1024 * 1024)} MB." });
        }

        var allowed = kind switch
        {
            MediaKind.Image => AllowedImageContentTypes,
            MediaKind.Video => AllowedVideoContentTypes,
            MediaKind.Document => AllowedDocumentContentTypes,
            _ => null,
        };
        if (allowed is null || !allowed.Contains(file.ContentType))
        {
            return BadRequest(new { error = $"Unsupported content type '{file.ContentType}' for media kind {kind}." });
        }

        Directory.CreateDirectory(_options.RootPath);
        var safeFileName = SafeFileName(file.FileName);
        var storedFileName = $"{DateTimeOffset.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}-{safeFileName}";
        var storagePath = Path.Combine(_options.RootPath, storedFileName);

        await using (var stream = System.IO.File.Create(storagePath))
        {
            await file.CopyToAsync(stream);
        }

        var asset = new MediaAsset
        {
            Id = Guid.NewGuid(),
            Kind = kind,
            OriginalFileName = file.FileName,
            ContentType = file.ContentType,
            SizeBytes = file.Length,
            StoragePath = storagePath,
        };
        _db.MediaAssets.Add(asset);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Uploaded media asset {AssetId} ({Kind}, {Size} bytes)", asset.Id, kind, file.Length);
        return Ok(MediaAssetResponse.FromEntity(asset));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var asset = await _db.MediaAssets.Include(m => m.PostMedia).FirstOrDefaultAsync(m => m.Id == id);
        if (asset is null) return NotFound();
        if (asset.PostMedia.Count > 0)
        {
            return BadRequest(new { error = "This media asset is attached to one or more posts and can't be deleted." });
        }

        _db.MediaAssets.Remove(asset);
        await _db.SaveChangesAsync();

        try
        {
            if (System.IO.File.Exists(asset.StoragePath)) System.IO.File.Delete(asset.StoragePath);
        }
        catch (IOException ex)
        {
            _logger.LogWarning(ex, "Failed to delete media file from disk for asset {AssetId}", id);
        }

        return NoContent();
    }

    /// <summary>Reduces an untrusted filename to a safe basename: no path separators, a conservative character set.</summary>
    private static string SafeFileName(string originalName)
    {
        var name = Path.GetFileName(originalName);
        var ext = Path.GetExtension(name);
        var stem = Path.GetFileNameWithoutExtension(name);

        var safeStem = new string(stem.Where(c => char.IsLetterOrDigit(c) || c is '-' or '_').ToArray());
        var safeExt = new string(ext.Where(c => char.IsLetterOrDigit(c) || c == '.').ToArray());

        if (safeStem.Length == 0) safeStem = "file";
        return safeStem[..Math.Min(safeStem.Length, 80)] + safeExt;
    }
}
