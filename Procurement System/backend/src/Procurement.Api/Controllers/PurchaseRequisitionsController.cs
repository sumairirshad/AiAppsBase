using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Features.Requisitions;

namespace Procurement.Api.Controllers;

[ApiController]
[Route("api/v1/requisitions")]
[Authorize]
public class PurchaseRequisitionsController : ControllerBase
{
    private readonly ISender _sender;
    public PurchaseRequisitionsController(ISender sender) => _sender = sender;

    [HttpPost]
    public async Task<ActionResult<long>> Create(CreatePrCommand command, CancellationToken ct) => Ok(await _sender.Send(command, ct));

    [HttpPost("{id:long}/submit")]
    public async Task<IActionResult> Submit(long id, CancellationToken ct)
    {
        await _sender.Send(new SubmitPrCommand(id), ct);
        return NoContent();
    }

    [HttpGet("mine")]
    public async Task<ActionResult<List<PrListItemDto>>> Mine(CancellationToken ct) => Ok(await _sender.Send(new ListMyPrsQuery(), ct));

    [HttpGet("inbox")]
    public async Task<ActionResult<List<PrListItemDto>>> Inbox(CancellationToken ct) => Ok(await _sender.Send(new ListPrInboxQuery(), ct));

    [HttpGet("{id:long}")]
    public async Task<ActionResult<PrDto>> Get(long id, CancellationToken ct) => Ok(await _sender.Send(new GetPrQuery(id), ct));

    [HttpGet("{id:long}/timeline")]
    public async Task<ActionResult<List<PrTimelineEntryDto>>> Timeline(long id, CancellationToken ct) => Ok(await _sender.Send(new GetPrTimelineQuery(id), ct));

    [HttpPost("{id:long}/approve")]
    public async Task<IActionResult> Approve(long id, [FromBody] RemarksRequest request, CancellationToken ct)
    {
        await _sender.Send(new ApprovePrCommand(id, request.Remarks), ct);
        return NoContent();
    }

    [HttpPost("{id:long}/reject")]
    public async Task<IActionResult> Reject(long id, [FromBody] ReasonRequest request, CancellationToken ct)
    {
        await _sender.Send(new RejectPrCommand(id, request.Reason), ct);
        return NoContent();
    }

    [HttpPost("{id:long}/return")]
    public async Task<IActionResult> Return(long id, [FromBody] ReasonRequest request, CancellationToken ct)
    {
        await _sender.Send(new ReturnPrCommand(id, request.Reason), ct);
        return NoContent();
    }

    [HttpPost("{id:long}/finance-approve")]
    public async Task<IActionResult> FinanceApprove(long id, FinanceApproveRequest request, CancellationToken ct)
    {
        await _sender.Send(new FinanceApprovePrCommand(id, request.BudgetRef, request.AvailableAmount, request.Remarks), ct);
        return NoContent();
    }

    [HttpPost("{id:long}/opd-budget-exception")]
    public async Task<IActionResult> OpdBudgetException(long id, [FromBody] DecisionRequest request, CancellationToken ct)
    {
        await _sender.Send(new OpdBudgetExceptionDecisionCommand(id, request.Approve, request.Reason), ct);
        return NoContent();
    }

    public record RemarksRequest(string? Remarks);
    public record ReasonRequest(string Reason);
    public record DecisionRequest(bool Approve, string Reason);
    public record FinanceApproveRequest(string BudgetRef, decimal AvailableAmount, string? Remarks);
}
