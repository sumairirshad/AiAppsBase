using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Audit;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Requisitions;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/audit")]
public class AuditController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public AuditController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("pr/{prId:long}/stamp")]
    public async Task<ActionResult<SubmitPrResult>> Stamp(long prId, StampRequest body, CancellationToken ct) =>
        await _mediator.Send(new AuditStampCommand(_currentUser.UserId, prId, body.Remarks), ct);

    [HttpPost("pr/{prId:long}/queries")]
    public async Task<ActionResult<long>> RaiseQuery(long prId, RaiseQueryRequest body, CancellationToken ct) =>
        await _mediator.Send(new RaiseQueryCommand(_currentUser.UserId, prId, body.QueryText, body.AssignedRoleCode), ct);

    [HttpPost("queries/{queryId:long}/respond")]
    public async Task<ActionResult<SubmitPrResult>> RespondQuery(long queryId, RespondQueryRequest body, CancellationToken ct) =>
        await _mediator.Send(new RespondQueryCommand(_currentUser.UserId, queryId, body.ResponseText), ct);

    [HttpGet("pr/{prId:long}/bill-history")]
    public async Task<ActionResult<BillHistoryDto>> BillHistory(long prId, CancellationToken ct) =>
        await _mediator.Send(new AuditBillReviewQuery(prId), ct);

    [HttpPost("month-end")]
    public async Task<ActionResult<long>> StartMonthEnd(StartMonthEndRequest body, CancellationToken ct) =>
        await _mediator.Send(new StartMonthEndAuditCommand(_currentUser.UserId, body.Period), ct);

    [HttpPost("month-end/{id:long}/complete")]
    public async Task<IActionResult> CompleteMonthEnd(long id, CompleteMonthEndRequest body, CancellationToken ct)
    {
        await _mediator.Send(new CompleteMonthEndAuditCommand(_currentUser.UserId, id, body.Summary), ct);
        return NoContent();
    }
}

public record StampRequest(string? Remarks);
public record RaiseQueryRequest(string QueryText, string AssignedRoleCode);
public record RespondQueryRequest(string ResponseText);
public record StartMonthEndRequest(string Period);
public record CompleteMonthEndRequest(string? Summary);
