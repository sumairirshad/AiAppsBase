using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Bills;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Requisitions;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/bills")]
public class BillsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public BillsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<ActionResult<long>> Upload(UploadBillRequest body, CancellationToken ct) =>
        await _mediator.Send(new UploadBillCommand(_currentUser.UserId, body.PrId, body.PoId, body.VendorId, body.VendorInvoiceRef, body.InvoiceDate, body.Total, body.DocumentId), ct);

    [HttpPost("{id:long}/forward")]
    public async Task<ActionResult<SubmitPrResult?>> Forward(long id, CancellationToken ct) =>
        await _mediator.Send(new ForwardBillCommand(_currentUser.UserId, id), ct);
}

public record UploadBillRequest(long PrId, long? PoId, long VendorId, string VendorInvoiceRef, DateOnly InvoiceDate, decimal Total, long DocumentId);
