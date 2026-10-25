using Instagram.Api.Entities;
using Instagram.Api.Models.Requests;
using Instagram.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instagram.Api.Controllers;

[ApiController]
[Route("api/publishing/jobs")]
[Authorize]
public class PublishingController(IPublishingJobService jobService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePublishingJobRequest request, CancellationToken ct)
    {
        var job = await jobService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = job.Id }, job);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? connectedAccountId, [FromQuery] PublishingJobStatus? status, CancellationToken ct) =>
        Ok(await jobService.GetJobsAsync(connectedAccountId, status, ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var job = await jobService.GetByIdAsync(id, ct);
        return job is null ? NotFound() : Ok(job);
    }

    [HttpPost("{id:guid}/retry")]
    public async Task<IActionResult> Retry(Guid id, CancellationToken ct) =>
        Ok(await jobService.RetryAsync(id, ct));
}
