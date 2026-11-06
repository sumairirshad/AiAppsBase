using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Recurring;
using Procurement.Application.Requisitions;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/recurring")]
public class RecurringController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public RecurringController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("plans")]
    public async Task<ActionResult<long>> CreatePlan(CreateRecurringPlanCommand body, CancellationToken ct) =>
        await _mediator.Send(body with { ActorUserId = _currentUser.UserId }, ct);

    [HttpPost("plans/{id:long}/approve")]
    public async Task<IActionResult> ApprovePlan(long id, CancellationToken ct)
    {
        await _mediator.Send(new ApproveRecurringPlanCommand(_currentUser.UserId, id), ct);
        return NoContent();
    }

    [HttpPost("plans/{id:long}/generate")]
    public async Task<ActionResult<long?>> GenerateOccurrence(long id, [FromQuery] DateOnly periodStart, [FromServices] RecurringOccurrenceGenerator generator, CancellationToken ct) =>
        await generator.GenerateForPeriodAsync(id, periodStart, ct);

    [HttpPost("pr/{prId:long}/verify-quote")]
    public async Task<ActionResult<SubmitPrResult>> VerifyQuote(long prId, VerifyQuoteRequest body, CancellationToken ct) =>
        await _mediator.Send(new VerifyRecurringQuoteCommand(_currentUser.UserId, prId, body.VerifiedUnitPrice), ct);
}

public record VerifyQuoteRequest(decimal VerifiedUnitPrice);
