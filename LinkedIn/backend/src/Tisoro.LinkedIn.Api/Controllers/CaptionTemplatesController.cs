using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tisoro.LinkedIn.Api.Data;
using Tisoro.LinkedIn.Api.Dtos;
using Tisoro.LinkedIn.Api.Models;

namespace Tisoro.LinkedIn.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/caption-templates")]
public sealed class CaptionTemplatesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CaptionTemplatesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<CaptionTemplateResponse>>> List([FromQuery] PostContentType? contentType)
    {
        var query = _db.CaptionTemplates.AsQueryable();
        if (contentType is not null) query = query.Where(t => t.ContentType == contentType);
        var templates = await query.OrderBy(t => t.Title).ToListAsync();
        return Ok(templates.Select(CaptionTemplateResponse.FromEntity).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CaptionTemplateResponse>> Get(Guid id)
    {
        var template = await _db.CaptionTemplates.FindAsync(id);
        if (template is null) return NotFound();
        return Ok(CaptionTemplateResponse.FromEntity(template));
    }

    [HttpPost]
    public async Task<ActionResult<CaptionTemplateResponse>> Create([FromBody] CaptionTemplateRequest request)
    {
        var template = new CaptionTemplate
        {
            Id = Guid.NewGuid(),
            ContentType = request.ContentType,
            Title = request.Title,
            TemplateBody = request.TemplateBody,
            CharacterLimit = request.CharacterLimit,
        };
        _db.CaptionTemplates.Add(template);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = template.Id }, CaptionTemplateResponse.FromEntity(template));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CaptionTemplateResponse>> Update(Guid id, [FromBody] CaptionTemplateRequest request)
    {
        var template = await _db.CaptionTemplates.FindAsync(id);
        if (template is null) return NotFound();

        template.ContentType = request.ContentType;
        template.Title = request.Title;
        template.TemplateBody = request.TemplateBody;
        template.CharacterLimit = request.CharacterLimit;
        template.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(CaptionTemplateResponse.FromEntity(template));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var template = await _db.CaptionTemplates.FindAsync(id);
        if (template is null) return NotFound();
        _db.CaptionTemplates.Remove(template);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
