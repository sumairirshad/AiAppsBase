using Microsoft.AspNetCore.Mvc;
using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Controllers;

[ApiController]
[Route("api/shorts")]
public class ShortsController : ControllerBase
{
    private readonly IShortStore _shortStore;

    public ShortsController(IShortStore shortStore)
    {
        _shortStore = shortStore;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var shorts = await _shortStore.GetShortsAsync(cancellationToken);
        return Ok(shorts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var found = await _shortStore.GetShortByIdAsync(id, cancellationToken);
        return found is null ? NotFound() : Ok(found);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShortRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FileName))
        {
            return BadRequest(new { message = "A video file is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Caption))
        {
            return BadRequest(new { message = "Caption is required." });
        }

        var created = await _shortStore.CreateShortAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var deleted = await _shortStore.DeleteShortAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
