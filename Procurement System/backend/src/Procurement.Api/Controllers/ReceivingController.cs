using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Features.Receiving;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
public class ReceivingController : ControllerBase
{
    private readonly ISender _sender;
    public ReceivingController(ISender sender) => _sender = sender;

    [HttpPost("api/v1/purchase-orders/{poId:long}/goods-receipts")]
    public async Task<ActionResult<long>> RecordGrn(long poId, [FromBody] RecordGrnRequest request, CancellationToken ct) =>
        Ok(await _sender.Send(new RecordGrnCommand(poId, request.ReceivedOn, request.DeliveryNoteNo, request.DeliveryNoteDocumentId, request.Lines), ct));

    [HttpGet("api/v1/requisitions/{prId:long}/goods-receipts")]
    public async Task<ActionResult<List<GrnDto>>> List(long prId, CancellationToken ct) => Ok(await _sender.Send(new ListGrnsForPrQuery(prId), ct));

    [HttpPost("api/v1/goods-receipts/{grnId:long}/acknowledge")]
    public async Task<IActionResult> Acknowledge(long grnId, [FromBody] AcknowledgeRequest request, CancellationToken ct)
    {
        await _sender.Send(new AcknowledgeGrnCommand(grnId, request.Accept, request.QualityRating, request.Remarks, request.DisputeReason), ct);
        return NoContent();
    }

    public record RecordGrnRequest(DateOnly ReceivedOn, string DeliveryNoteNo, long? DeliveryNoteDocumentId, List<GrnLineInput> Lines);
    public record AcknowledgeRequest(bool Accept, byte? QualityRating, string? Remarks, string? DisputeReason);
}
