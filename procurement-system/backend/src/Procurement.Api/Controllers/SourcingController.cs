using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Requisitions;
using Procurement.Application.Sourcing;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/sourcing")]
public class SourcingController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public SourcingController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("pr/{prId:long}/accept")]
    public async Task<ActionResult<List<long>>> AcceptAndGroup(long prId, CancellationToken ct) =>
        await _mediator.Send(new AcceptAndGroupCommand(_currentUser.UserId, prId), ct);

    [HttpPost("groups/{groupId:long}/quotations")]
    public async Task<ActionResult<long>> AddQuotation(long groupId, AddQuotationRequest body, CancellationToken ct) =>
        await _mediator.Send(new AddQuotationCommand(_currentUser.UserId, groupId, body.VendorId, body.QuotationNo, body.QuotationDate, body.TaxTotal, body.DocumentId, body.Lines), ct);

    [HttpPost("groups/{groupId:long}/select")]
    public async Task<ActionResult<SubmitPrResult>> SelectQuote(long groupId, SelectQuoteRequest body, CancellationToken ct) =>
        await _mediator.Send(new SelectQuoteCommand(_currentUser.UserId, groupId, body.QuotationId, body.Justification), ct);

    [HttpPost("lines/{prLineId:long}/override-vendor")]
    public async Task<IActionResult> OverrideVendor(long prLineId, OverrideVendorRequest body, CancellationToken ct)
    {
        await _mediator.Send(new OverrideSuggestedVendorCommand(_currentUser.UserId, prLineId, body.NewVendorId, body.Reason), ct);
        return NoContent();
    }
}

public record AddQuotationRequest(long VendorId, string QuotationNo, DateOnly QuotationDate, decimal TaxTotal, long DocumentId, List<QuotationLineInput> Lines);
public record SelectQuoteRequest(long QuotationId, string? Justification);
public record OverrideVendorRequest(long NewVendorId, string Reason);
