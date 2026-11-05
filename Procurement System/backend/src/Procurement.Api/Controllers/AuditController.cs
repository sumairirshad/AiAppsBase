using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Features.Audit;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/audit")]
public class AuditController : ControllerBase
{
    private readonly ISender _sender;
    public AuditController(ISender sender) => _sender = sender;

    [HttpPost("requisitions/{prId:long}/stamp")]
    public async Task<IActionResult> Stamp(long prId, [FromBody] StampRequest request, CancellationToken ct)
    {
        await _sender.Send(new StampPrCommand(prId, request.PaymentVerified, request.DeliveryVerified, request.Remarks), ct);
        return NoContent();
    }

    [HttpGet("requisitions/{prId:long}/stamp")]
    public async Task<ActionResult<AuditStampDto?>> GetStamp(long prId, CancellationToken ct) => Ok(await _sender.Send(new ListAuditStampsQuery(prId), ct));

    [HttpPost("queries")]
    public async Task<ActionResult<long>> RaiseQuery(RaiseAuditQueryCommand command, CancellationToken ct) => Ok(await _sender.Send(command, ct));

    [HttpPost("queries/{queryId:long}/respond")]
    public async Task<IActionResult> RespondQuery(long queryId, [FromBody] RespondRequest request, CancellationToken ct)
    {
        await _sender.Send(new RespondAuditQueryCommand(queryId, request.ResponseText, request.ReturnToPrStatusCode), ct);
        return NoContent();
    }

    [HttpGet("queries")]
    public async Task<ActionResult<List<AuditQueryDto>>> ListQueries([FromQuery] string entityTypeCode, [FromQuery] long entityId, CancellationToken ct) =>
        Ok(await _sender.Send(new ListAuditQueriesQuery(entityTypeCode, entityId), ct));

    public record StampRequest(bool PaymentVerified, bool DeliveryVerified, string? Remarks);
    public record RespondRequest(string ResponseText, string ReturnToPrStatusCode);
}
