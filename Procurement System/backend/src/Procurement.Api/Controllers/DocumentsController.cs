using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Api.Controllers;

[ApiController]
[Route("api/v1/documents")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IProcurementDbContext _db;
    private readonly IFileStorageService _fileStorage;
    private readonly ICurrentUserContext _currentUser;

    public DocumentsController(IProcurementDbContext db, IFileStorageService fileStorage, ICurrentUserContext currentUser)
    {
        _db = db;
        _fileStorage = fileStorage;
        _currentUser = currentUser;
    }

    public record DocumentUploadResult(long Id, string FileName, long SizeBytes);
    public class UploadDocumentForm
    {
        public IFormFile File { get; set; } = null!;
        public string DocumentTypeCode { get; set; } = null!;
    }

    [HttpPost]
    [RequestSizeLimit(25_000_000)]
    public async Task<ActionResult<DocumentUploadResult>> Upload([FromForm] UploadDocumentForm form, CancellationToken ct)
    {
        var file = form.File;
        if (file.Length == 0)
        {
            return BadRequest(new { title = "Validation Failed", detail = "The uploaded file is empty." });
        }

        var documentType = await _db.DocumentTypes.FirstOrDefaultAsync(t => t.Code == form.DocumentTypeCode, ct);
        if (documentType == null)
        {
            return BadRequest(new { title = "Validation Failed", detail = $"Unknown document type '{form.DocumentTypeCode}'." });
        }

        var storageKey = $"{Guid.NewGuid():N}-{Path.GetFileName(file.FileName)}";
        string sha256Hex;

        using (var sha256 = SHA256.Create())
        await using (var sourceStream = file.OpenReadStream())
        {
            var hashBytes = await sha256.ComputeHashAsync(sourceStream, ct);
            sha256Hex = Convert.ToHexString(hashBytes);
            sourceStream.Position = 0;
            await _fileStorage.SaveAsync(sourceStream, storageKey, ct);
        }

        var now = DateTime.UtcNow;
        var document = new Documents
        {
            StorageKey = storageKey,
            FileName = file.FileName,
            ContentType = file.ContentType,
            SizeBytes = file.Length,
            Sha256 = sha256Hex,
            DocumentTypeId = documentType.Id,
            Classification = "Internal",
            VersionNo = 1,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        };
        _db.Documents.Add(document);
        await _db.SaveChangesAsync(ct);

        return Ok(new DocumentUploadResult(document.Id, document.FileName, document.SizeBytes));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> Download(long id, CancellationToken ct)
    {
        var document = await _db.Documents.FirstOrDefaultAsync(d => d.Id == id, ct);
        if (document == null) return NotFound();

        var stream = await _fileStorage.OpenReadAsync(document.StorageKey, ct);
        return File(stream, document.ContentType, document.FileName);
    }
}
