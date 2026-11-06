using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Policy;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/policy")]
public class PolicyController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public PolicyController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet("current")]
    public async Task<ActionResult<CurrentPolicyDto>> Current(CancellationToken ct) => await _mediator.Send(new GetCurrentPolicyQuery(), ct);

    [HttpPost("versions")]
    public async Task<ActionResult<long>> CreateVersion(CreateVersionRequest body, CancellationToken ct) =>
        await _mediator.Send(new CreatePolicyVersionCommand(_currentUser.UserId, body.ChangeReason, body.EffectiveFrom), ct);

    [HttpPut("settings/{settingKey}")]
    public async Task<IActionResult> UpdateSetting(string settingKey, UpdateSettingRequest body, CancellationToken ct)
    {
        await _mediator.Send(new UpdatePolicySettingCommand(_currentUser.UserId, settingKey, body.Value), ct);
        return NoContent();
    }

    [HttpPost("approval-bands")]
    public async Task<ActionResult<long>> CreateApprovalBand(UpsertApprovalBandCommand body, CancellationToken ct) =>
        await _mediator.Send(body with { ActorUserId = _currentUser.UserId }, ct);

    [HttpPost("quotation-rules")]
    public async Task<ActionResult<long>> CreateQuotationRule(UpsertQuotationRuleCommand body, CancellationToken ct) =>
        await _mediator.Send(body with { ActorUserId = _currentUser.UserId }, ct);
}

public record CreateVersionRequest(string ChangeReason, DateOnly EffectiveFrom);
public record UpdateSettingRequest(string Value);
