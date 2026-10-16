using GbpDashboard.Api.Models;
using GbpDashboard.Api.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace GbpDashboard.Api.Controllers;

[ApiController]
[Route("api/media")]
public class MediaController : ControllerBase
{
    private readonly IMediaRepository _repository;

    public MediaController(IMediaRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<List<MediaItem>>> GetAll()
    {
        var items = await _repository.GetAllAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<MediaItem>> Create([FromBody] MediaItem item)
    {
        var created = await _repository.CreateAsync(item);
        return Ok(created);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var deleted = await _repository.DeleteAsync(id);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
