using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Purchasing;
using Procurement.Application.Requisitions;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/purchasing")]
public class PurchasingController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public PurchasingController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost("pr/{prId:long}/orders")]
    public async Task<ActionResult<List<long>>> CreatePurchaseOrders(long prId, CreatePoRequest body, CancellationToken ct) =>
        await _mediator.Send(new CreatePurchaseOrdersCommand(_currentUser.UserId, prId, body.IdempotencyKey, body.AdvanceTypeCode, body.AdvancePct, body.AdvanceAmount, body.DeliveryDate, body.PaymentTerms), ct);

    [HttpPost("orders/{poId:long}/contract")]
    public async Task<ActionResult<long>> GenerateContract(long poId, GenerateContractRequest body, CancellationToken ct) =>
        await _mediator.Send(new GenerateContractCommand(_currentUser.UserId, poId, body.TemplateId, body.StartDate, body.EndDate, body.CountryOfOrigin, body.Incoterms), ct);

    [HttpPost("orders/{poId:long}/activate")]
    public async Task<ActionResult<SubmitPrResult?>> Activate(long poId, ActivateContractRequest body, CancellationToken ct) =>
        await _mediator.Send(new ActivateContractCommand(_currentUser.UserId, poId, body.SignedDocumentId, body.ChequeNo, body.ChequeBank, body.ChequeAmount, body.ChequeDocumentId), ct);

    [HttpPost("orders/{poId:long}/amend")]
    public async Task<ActionResult<long>> Amend(long poId, AmendPoRequest body, CancellationToken ct) =>
        await _mediator.Send(new AmendPurchaseOrderCommand(_currentUser.UserId, poId, body.AmendmentTypeCode, body.OldValue, body.NewValue, body.IsEscalation, body.Reason), ct);
}

public record CreatePoRequest(Guid IdempotencyKey, string AdvanceTypeCode, decimal? AdvancePct, decimal? AdvanceAmount, DateOnly DeliveryDate, string? PaymentTerms);
public record GenerateContractRequest(long TemplateId, DateOnly? StartDate, DateOnly? EndDate, string? CountryOfOrigin, string? Incoterms);
public record ActivateContractRequest(long SignedDocumentId, string ChequeNo, string ChequeBank, decimal ChequeAmount, long ChequeDocumentId);
public record AmendPoRequest(string AmendmentTypeCode, string OldValue, string NewValue, bool IsEscalation, string Reason);
