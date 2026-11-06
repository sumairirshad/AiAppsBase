using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Receiving;
using Procurement.Application.Requisitions;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/receiving")]
public class ReceivingController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ReceivingController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("orders/{poId:long}/grn")]
    public async Task<ActionResult<SubmitPrResult?>> RecordGrn(long poId, RecordGrnRequest body, CancellationToken ct) =>
        await _mediator.Send(new RecordGrnCommand(_currentUser.UserId, poId, body.DeliveryNoteNo, body.ReceivedOn, body.Lines), ct);

    [HttpPost("pr/{prId:long}/acknowledge")]
    public async Task<ActionResult<SubmitPrResult>> Acknowledge(long prId, AcknowledgeRequest body, CancellationToken ct) =>
        await _mediator.Send(new AcknowledgeDeliveryCommand(_currentUser.UserId, prId, body.Accepted, body.QualityRating, body.Remarks, body.DisputeReason), ct);
}

public record RecordGrnRequest(string DeliveryNoteNo, DateOnly ReceivedOn, List<GrnLineInput> Lines);
public record AcknowledgeRequest(bool Accepted, byte? QualityRating, string? Remarks, string? DisputeReason);
