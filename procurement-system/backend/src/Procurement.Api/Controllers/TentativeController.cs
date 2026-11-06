using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Tentative;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/tentative")]
public class TentativeController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public TentativeController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("pr/{prId:long}/manual-po")]
    public async Task<ActionResult<long>> CreateManualPo(long prId, ManualPoRequest body, CancellationToken ct) =>
        await _mediator.Send(new CreateManualPoCommand(_currentUser.UserId, prId, body.VendorId, body.EstimatedTotal, body.AdvanceTypeCode, body.AdvanceAmount), ct);

    [HttpPost("pr/{prId:long}/final-cost")]
    public async Task<ActionResult<FinalCostResult>> EnterFinalCost(long prId, FinalCostRequest body, CancellationToken ct) =>
        await _mediator.Send(new EnterFinalCostCommand(_currentUser.UserId, prId, body.ManualPoId, body.FinalAmount), ct);

    [HttpPost("pr/{prId:long}/approve-variance")]
    public async Task<ActionResult<long>> ApproveVariance(long prId, CancellationToken ct) =>
        await _mediator.Send(new ApproveTentativeVarianceCommand(_currentUser.UserId, prId), ct);
}

public record ManualPoRequest(long VendorId, decimal EstimatedTotal, string? AdvanceTypeCode, decimal? AdvanceAmount);
public record FinalCostRequest(long ManualPoId, decimal FinalAmount);
