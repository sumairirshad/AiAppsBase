using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Api.Authorization;
using Procurement.Application.Features.Recurring;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/recurring-plans")]
public class RecurringPlansController : ControllerBase
{
    private readonly ISender _sender;
    public RecurringPlansController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<List<RecurringPlanDto>>> List(CancellationToken ct) => Ok(await _sender.Send(new ListRecurringPlansQuery(), ct));

    [HttpPost]
    [RequirePermission("ADMIN.RECURRING_PLANS")]
    public async Task<ActionResult<long>> Create(CreateRecurringPlanCommand command, CancellationToken ct) => Ok(await _sender.Send(command, ct));

    [HttpPost("{planId:long}/generate-occurrence")]
    public async Task<ActionResult<long>> GenerateOccurrence(long planId, CancellationToken ct) => Ok(await _sender.Send(new GenerateRecurringOccurrenceCommand(planId), ct));

    [HttpPost("occurrences/{prId:long}/attach-bill")]
    public async Task<IActionResult> AttachBill(long prId, [FromBody] AttachBillRequest request, CancellationToken ct)
    {
        await _sender.Send(new AttachCyclicBillCommand(prId, request.BillingPeriod, request.BillAmount, request.Purpose, request.DueDate, request.BillDocumentId), ct);
        return NoContent();
    }

    public record AttachBillRequest(string BillingPeriod, decimal BillAmount, string Purpose, DateOnly DueDate, long BillDocumentId);
}
