using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TikTok.Api.Models.Dtos;
using TikTok.Api.Security;
using TikTok.Api.Services;

namespace TikTok.Api.Controllers;

[ApiController]
[Route("api/publishing/jobs")]
[Authorize(AuthenticationSchemes = AdminApiKeyAuthenticationHandler.SchemeName)]
public class PublishingController : ControllerBase
{
    private readonly IPublishingService _publishingService;

    public PublishingController(IPublishingService publishingService)
    {
        _publishingService = publishingService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PublishingJobDto>>> List(CancellationToken ct)
    {
        return Ok(await _publishingService.ListJobsAsync(ct));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PublishingJobDto>> Get(Guid id, CancellationToken ct)
    {
        var job = await _publishingService.GetJobAsync(id, ct);
        return job is null ? NotFound() : Ok(job);
    }

    [HttpPost]
    public async Task<ActionResult<PublishingJobDto>> Create([FromBody] CreatePublishingJobRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var job = await _publishingService.CreateJobAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { id = job.Id }, job);
    }

    [HttpPost("{id:guid}/retry")]
    public async Task<ActionResult<PublishingJobDto>> Retry(Guid id, CancellationToken ct)
    {
        var job = await _publishingService.RetryAsync(id, ct);
        return job is null ? NotFound() : Ok(job);
    }
}
