using Microsoft.AspNetCore.Mvc;
using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Controllers;

[ApiController]
[Route("api/posts")]
public class PostsController : ControllerBase
{
    private readonly IPostStore _postStore;

    public PostsController(IPostStore postStore)
    {
        _postStore = postStore;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var posts = await _postStore.GetPostsAsync(cancellationToken);
        return Ok(posts);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var post = await _postStore.GetPostByIdAsync(id, cancellationToken);
        return post is null ? NotFound() : Ok(post);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePostRequest request, CancellationToken cancellationToken)
    {
        if (request.Type == PostType.Text && string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest(new { message = "Post text is required." });
        }

        if (request.Type == PostType.Image && request.ImageUrls.Count == 0)
        {
            return BadRequest(new { message = "At least one image is required." });
        }

        var created = await _postStore.CreatePostAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdatePostRequest request, CancellationToken cancellationToken)
    {
        var updated = await _postStore.UpdatePostAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var deleted = await _postStore.DeletePostAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("{id}/pin")]
    public async Task<IActionResult> Pin(string id, CancellationToken cancellationToken)
    {
        var pinned = await _postStore.SetPinnedAsync(id, cancellationToken);
        return pinned is null ? NotFound() : Ok(pinned);
    }
}
