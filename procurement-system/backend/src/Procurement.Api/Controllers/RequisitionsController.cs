using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Requisitions;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/requisitions")]
public class RequisitionsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public RequisitionsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<ActionResult<long>> Create(CreatePrRequest body, CancellationToken ct) =>
        await _mediator.Send(new CreatePrCommand(_currentUser.UserId, body.DepartmentId, body.LocationId, body.SpendSubHeadCode,
            body.ProjectId, body.CostTypeCode, body.IsEmergency, body.EmergencyJustification, body.Title, body.Lines), ct);

    [HttpPost("{id:long}/submit")]
    public async Task<ActionResult<SubmitPrResult>> Submit(long id, CancellationToken ct) =>
        await _mediator.Send(new SubmitPrCommand(_currentUser.UserId, id), ct);

    [HttpGet("mine")]
    public async Task<ActionResult<List<PrListItemDto>>> Mine(CancellationToken ct) =>
        await _mediator.Send(new ListMyPrsQuery(_currentUser.UserId), ct);

    [HttpGet("inbox")]
    public async Task<ActionResult<List<PrListItemDto>>> Inbox([FromQuery] string roleCode, CancellationToken ct) =>
        await _mediator.Send(new ListInboxQuery(_currentUser.UserId, roleCode), ct);

    [HttpGet("{id:long}")]
    public async Task<ActionResult<PrDetailDto>> Detail(long id, CancellationToken ct) =>
        await _mediator.Send(new GetPrDetailQuery(_currentUser.UserId, id), ct);

    [HttpPost("{id:long}/act")]
    public async Task<ActionResult<SubmitPrResult>> Act(long id, ActPrRequest body, CancellationToken ct) =>
        await _mediator.Send(new ActPrCommand(_currentUser.UserId, id, body.RoleCode, body.ActionCode, body.Remarks), ct);

    [HttpPost("{id:long}/force-revert")]
    public async Task<IActionResult> ForceRevert(long id, ReasonRequest body, CancellationToken ct)
    {
        await _mediator.Send(new ForceRevertPrCommand(_currentUser.UserId, id, body.Reason), ct);
        return NoContent();
    }

    [HttpPost("{id:long}/void")]
    public async Task<IActionResult> Void(long id, ReasonRequest body, CancellationToken ct)
    {
        await _mediator.Send(new VoidPrCommand(_currentUser.UserId, id, body.Reason), ct);
        return NoContent();
    }
}

public record CreatePrRequest(long DepartmentId, long LocationId, string SpendSubHeadCode, long? ProjectId, string CostTypeCode, bool IsEmergency, string? EmergencyJustification, string Title, List<PrLineInput> Lines);
public record ActPrRequest(string RoleCode, string ActionCode, string? Remarks);
public record ReasonRequest(string Reason);
