using Microsoft.AspNetCore.Mvc;
using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Controllers;

[ApiController]
[Route("api/scheduler")]
public class SchedulerController : ControllerBase
{
    private readonly ISchedulerStore _schedulerStore;

    public SchedulerController(ISchedulerStore schedulerStore)
    {
        _schedulerStore = schedulerStore;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var items = await _schedulerStore.GetScheduledPostsAsync(cancellationToken);
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id, CancellationToken cancellationToken)
    {
        var item = await _schedulerStore.GetScheduledPostByIdAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateScheduledPostRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text) && request.MediaIds.Count == 0)
        {
            return BadRequest(new { message = "Post content is required." });
        }

        if (request.ScheduledFor <= DateTimeOffset.UtcNow)
        {
            return BadRequest(new { message = "Scheduled time must be in the future." });
        }

        var created = await _schedulerStore.CreateScheduledPostAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateScheduledPostRequest request, CancellationToken cancellationToken)
    {
        var updated = await _schedulerStore.UpdateScheduledPostAsync(id, request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Cancel(string id, CancellationToken cancellationToken)
    {
        var cancelled = await _schedulerStore.CancelScheduledPostAsync(id, cancellationToken);
        return cancelled ? NoContent() : NotFound();
    }

    [HttpPost("{id}/publish-now")]
    public async Task<IActionResult> PublishNow(string id, CancellationToken cancellationToken)
    {
        var published = await _schedulerStore.PublishNowAsync(id, cancellationToken);
        return published is null ? NotFound() : Ok(published);
    }
}
