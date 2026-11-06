using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Vendoring;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/vendors")]
public class VendorsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public VendorsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<List<VendorDto>>> List(CancellationToken ct) => await _mediator.Send(new ListVendorsQuery(), ct);

    [HttpGet("suggest")]
    public async Task<ActionResult<List<VendorSuggestionDto>>> Suggest([FromQuery] long categoryId, CancellationToken ct) =>
        await _mediator.Send(new SuggestVendorsForCategoryQuery(categoryId), ct);

    [HttpPost("registrations")]
    public async Task<ActionResult<long>> Register(VendorRegistrationData body, CancellationToken ct) =>
        await _mediator.Send(new RegisterVendorCommand(_currentUser.UserId, body), ct);

    [HttpGet("registrations")]
    public async Task<ActionResult<List<PendingVendorRegistrationDto>>> PendingRegistrations([FromQuery] string statusCode, CancellationToken ct) =>
        await _mediator.Send(new ListPendingVendorRegistrationsQuery(statusCode), ct);

    [HttpPost("registrations/{id:long}/procurement-decision")]
    public async Task<IActionResult> ProcurementDecision(long id, DecisionBody body, CancellationToken ct)
    {
        await _mediator.Send(new ProcurementVendorDecisionCommand(_currentUser.UserId, id, body.Approve, body.Reason), ct);
        return NoContent();
    }

    [HttpPost("registrations/{id:long}/procurement-hod-decision")]
    public async Task<ActionResult<long?>> ProcurementHodDecision(long id, DecisionBody body, CancellationToken ct) =>
        await _mediator.Send(new ProcurementHodVendorDecisionCommand(_currentUser.UserId, id, body.Approve, body.Reason), ct);

    [HttpPost("{id:long}/blacklist")]
    public async Task<IActionResult> Blacklist(long id, BlacklistBody body, CancellationToken ct)
    {
        await _mediator.Send(new BlacklistVendorCommand(_currentUser.UserId, id, body.Reason), ct);
        return NoContent();
    }
}

public record DecisionBody(bool Approve, string? Reason);
public record BlacklistBody(string Reason);
