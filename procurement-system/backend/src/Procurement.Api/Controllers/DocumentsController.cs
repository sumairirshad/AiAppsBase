using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/documents")]
public class DocumentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _storage;
    private readonly IApplicationDbContext _db;

    public DocumentsController(IMediator mediator, ICurrentUserService currentUser, IFileStorageService storage, IApplicationDbContext db)
    {
        _mediator = mediator;
        _currentUser = currentUser;
        _storage = storage;
        _db = db;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(50_000_000)]
    public async Task<ActionResult<long>> Upload([FromForm] IFormFile file, [FromForm] string documentTypeCode, CancellationToken ct)
    {
        if (file.Length == 0) return BadRequest("Empty file.");
        await using var stream = file.OpenReadStream();
        var id = await _mediator.Send(new UploadDocumentCommand(_currentUser.UserId, stream, file.FileName, file.ContentType, documentTypeCode), ct);
        return Ok(id);
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> Download(long id, CancellationToken ct)
    {
        var doc = await _db.Set<Domain.Entities.Documents>().FindAsync(new object[] { id }, ct);
        if (doc is null) return NotFound();
        var stream = await _storage.OpenAsync(doc.StorageKey, ct);
        return File(stream, doc.ContentType, doc.FileName);
    }
}
