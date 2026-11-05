using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Features.Purchasing;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
public class PurchasingController : ControllerBase
{
    private readonly ISender _sender;
    public PurchasingController(ISender sender) => _sender = sender;

    [HttpPost("api/v1/requisitions/{prId:long}/purchase-orders")]
    public async Task<ActionResult<List<long>>> CreatePurchaseOrders(long prId, [FromBody] CreatePurchaseOrdersRequest request, CancellationToken ct) =>
        Ok(await _sender.Send(new CreatePurchaseOrdersCommand(prId, request.PurchaseOrders, request.IdempotencyKey), ct));

    [HttpGet("api/v1/requisitions/{prId:long}/purchase-orders")]
    public async Task<ActionResult<List<PurchaseOrderDto>>> ListPurchaseOrders(long prId, CancellationToken ct) =>
        Ok(await _sender.Send(new ListPurchaseOrdersForPrQuery(prId), ct));

    [HttpPost("api/v1/purchase-orders/{poId:long}/contract")]
    public async Task<IActionResult> IssueContract(long poId, IssueContractCommand command, CancellationToken ct)
    {
        if (poId != command.PoId) return BadRequest();
        await _sender.Send(command, ct);
        return NoContent();
    }

    [HttpPost("api/v1/requisitions/{prId:long}/complete-contract-issuance")]
    public async Task<IActionResult> CompleteContractIssuance(long prId, CancellationToken ct)
    {
        await _sender.Send(new CompleteContractIssuanceCommand(prId), ct);
        return NoContent();
    }

    public record CreatePurchaseOrdersRequest(List<CreatePoInput> PurchaseOrders, Guid? IdempotencyKey);
}
