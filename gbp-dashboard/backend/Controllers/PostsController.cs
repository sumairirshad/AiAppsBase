using GbpDashboard.Api.Models;
using GbpDashboard.Api.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace GbpDashboard.Api.Controllers;

[ApiController]
[Route("api/posts")]
public class PostsController : ControllerBase
{
    private readonly IPostRepository _repository;

    public PostsController(IPostRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<List<Post>>> GetAll()
    {
        var posts = await _repository.GetAllAsync();
        return Ok(posts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Post>> GetById(string id)
    {
        var post = await _repository.GetByIdAsync(id);
        if (post is null)
        {
            return NotFound();
        }

        return Ok(post);
    }

    [HttpPost]
    public async Task<ActionResult<Post>> Create([FromBody] Post post)
    {
        var created = await _repository.CreateAsync(post);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Post>> Update(string id, [FromBody] Post post)
    {
        var updated = await _repository.UpdateAsync(id, post);
        if (updated is null)
        {
            return NotFound();
        }

        return Ok(updated);
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
