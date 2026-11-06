using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Features.Sourcing;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
public class SourcingController : ControllerBase
{
    private readonly ISender _sender;
    public SourcingController(ISender sender) => _sender = sender;

    [HttpPost("api/v1/requisitions/{prId:long}/accept-for-sourcing")]
    public async Task<IActionResult> AcceptForSourcing(long prId, CancellationToken ct)
    {
        await _sender.Send(new AcceptPrForSourcingCommand(prId), ct);
        return NoContent();
    }

    [HttpGet("api/v1/requisitions/{prId:long}/sourcing-groups")]
    public async Task<ActionResult<List<SourcingGroupDto>>> ListGroups(long prId, CancellationToken ct) =>
        Ok(await _sender.Send(new ListSourcingGroupsQuery(prId), ct));

    [HttpGet("api/v1/sourcing-groups/{groupId:long}/quotations")]
    public async Task<ActionResult<List<QuotationDto>>> ListQuotations(long groupId, CancellationToken ct) =>
        Ok(await _sender.Send(new ListQuotationsForGroupQuery(groupId), ct));

    [HttpPost("api/v1/sourcing-groups/{groupId:long}/quotations")]
    public async Task<ActionResult<long>> AddQuotation(long groupId, [FromBody] AddQuotationRequest request, CancellationToken ct) =>
        Ok(await _sender.Send(new AddQuotationCommand(groupId, request.VendorId, request.QuotationNo, request.QuotationDate, request.DocumentId, request.Lines), ct));

    [HttpPost("api/v1/requisitions/{prId:long}/complete-quotations")]
    public async Task<IActionResult> CompleteQuotations(long prId, CancellationToken ct)
    {
        await _sender.Send(new CompleteQuotationsCommand(prId), ct);
        return NoContent();
    }

    [HttpPost("api/v1/sourcing-groups/{groupId:long}/select-quotation")]
    public async Task<IActionResult> SelectQuotation(long groupId, [FromBody] SelectQuotationRequest request, CancellationToken ct)
    {
        await _sender.Send(new SelectQuotationCommand(groupId, request.QuotationId, request.Justification), ct);
        return NoContent();
    }

    [HttpPost("api/v1/requisitions/{prId:long}/complete-quote-review")]
    public async Task<IActionResult> CompleteQuoteReview(long prId, CancellationToken ct)
    {
        await _sender.Send(new CompleteQuoteReviewCommand(prId), ct);
        return NoContent();
    }

    [HttpPost("api/v1/requisitions/{prId:long}/opd-quote-exception")]
    public async Task<IActionResult> OpdQuoteException(long prId, [FromBody] OpdQuoteExceptionDecisionRequest request, CancellationToken ct)
    {
        await _sender.Send(new OpdQuoteExceptionDecisionCommand(prId, request.Approve, request.Reason), ct);
        return NoContent();
    }

    public record AddQuotationRequest(long VendorId, string QuotationNo, DateOnly QuotationDate, long DocumentId, List<QuotationLineInput> Lines);
    public record SelectQuotationRequest(long QuotationId, string? Justification);
    public record OpdQuoteExceptionDecisionRequest(bool Approve, string Reason);
}
