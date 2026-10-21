using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tisoro.LinkedIn.Api.Data;
using Tisoro.LinkedIn.Api.Dtos;
using Tisoro.LinkedIn.Api.Models;

namespace Tisoro.LinkedIn.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/engagement")]
public sealed class EngagementController : ControllerBase
{
    private readonly AppDbContext _db;

    public EngagementController(AppDbContext db) => _db = db;

    [HttpGet("targets")]
    public async Task<ActionResult<List<EngagementTargetResponse>>> ListTargets()
    {
        var targets = await _db.EngagementTargets.Include(t => t.Tasks).OrderBy(t => t.Name).ToListAsync();
        return Ok(targets.Select(EngagementTargetResponse.FromEntity).ToList());
    }

    [HttpPost("targets")]
    public async Task<ActionResult<EngagementTargetResponse>> CreateTarget([FromBody] EngagementTargetRequest request)
    {
        var target = new EngagementTarget
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            LinkedInProfileUrl = request.LinkedInProfileUrl,
            Notes = request.Notes,
        };
        _db.EngagementTargets.Add(target);
        await _db.SaveChangesAsync();
        return Ok(EngagementTargetResponse.FromEntity(target));
    }

    [HttpDelete("targets/{id:guid}")]
    public async Task<IActionResult> DeleteTarget(Guid id)
    {
        var target = await _db.EngagementTargets.FindAsync(id);
        if (target is null) return NotFound();
        _db.EngagementTargets.Remove(target);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("tasks")]
    public async Task<ActionResult<List<EngagementTaskResponse>>> ListTasks([FromQuery] EngagementTaskStatus? status)
    {
        var query = _db.EngagementTasks.Include(t => t.Target).AsQueryable();
        if (status is not null) query = query.Where(t => t.Status == status);
        var tasks = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return Ok(tasks.Select(EngagementTaskResponse.FromEntity).ToList());
    }

    [HttpPost("tasks")]
    public async Task<ActionResult<EngagementTaskResponse>> CreateTask([FromBody] EngagementTaskRequest request)
    {
        var targetExists = await _db.EngagementTargets.AnyAsync(t => t.Id == request.EngagementTargetId);
        if (!targetExists) return BadRequest(new { error = "The referenced engagement target does not exist." });

        var task = new EngagementTask
        {
            Id = Guid.NewGuid(),
            EngagementTargetId = request.EngagementTargetId,
            ActionType = request.ActionType,
            SourcePostUrl = request.SourcePostUrl,
            SuggestedText = request.SuggestedText,
        };
        _db.EngagementTasks.Add(task);
        await _db.SaveChangesAsync();

        var reloaded = await _db.EngagementTasks.Include(t => t.Target).FirstAsync(t => t.Id == task.Id);
        return Ok(EngagementTaskResponse.FromEntity(reloaded));
    }

    [HttpPost("tasks/{id:guid}/complete")]
    public async Task<ActionResult<EngagementTaskResponse>> CompleteTask(Guid id)
    {
        var task = await _db.EngagementTasks.Include(t => t.Target).FirstOrDefaultAsync(t => t.Id == id);
        if (task is null) return NotFound();

        task.Status = EngagementTaskStatus.Done;
        task.CompletedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(EngagementTaskResponse.FromEntity(task));
    }

    [HttpPost("tasks/{id:guid}/dismiss")]
    public async Task<ActionResult<EngagementTaskResponse>> DismissTask(Guid id)
    {
        var task = await _db.EngagementTasks.Include(t => t.Target).FirstOrDefaultAsync(t => t.Id == id);
        if (task is null) return NotFound();

        task.Status = EngagementTaskStatus.Dismissed;
        task.CompletedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(EngagementTaskResponse.FromEntity(task));
    }
}
