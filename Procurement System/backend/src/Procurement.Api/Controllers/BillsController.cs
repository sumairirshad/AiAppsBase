using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Features.Bills;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
public class BillsController : ControllerBase
{
    private readonly ISender _sender;
    public BillsController(ISender sender) => _sender = sender;

    [HttpPost("api/v1/requisitions/{prId:long}/bills")]
    public async Task<ActionResult<long>> Upload(long prId, [FromBody] UploadBillRequest request, CancellationToken ct) =>
        Ok(await _sender.Send(new UploadBillCommand(prId, request.PoId, request.VendorId, request.VendorInvoiceRef, request.InvoiceDate, request.Total, request.DocumentId), ct));

    [HttpGet("api/v1/requisitions/{prId:long}/bills")]
    public async Task<ActionResult<List<SupplierInvoiceDto>>> List(long prId, CancellationToken ct) => Ok(await _sender.Send(new ListBillsForPrQuery(prId), ct));

    [HttpPost("api/v1/bills/{invoiceId:long}/forward")]
    public async Task<IActionResult> Forward(long invoiceId, CancellationToken ct)
    {
        await _sender.Send(new ForwardBillCommand(invoiceId), ct);
        return NoContent();
    }

    [HttpPost("api/v1/requisitions/{prId:long}/complete-bill-upload")]
    public async Task<IActionResult> CompleteBillUpload(long prId, CancellationToken ct)
    {
        await _sender.Send(new CompleteBillUploadCommand(prId), ct);
        return NoContent();
    }

    [HttpPost("api/v1/requisitions/{prId:long}/simulate-finance-portal-payment")]
    public async Task<IActionResult> SimulatePayment(long prId, CancellationToken ct)
    {
        await _sender.Send(new SimulateFinancePortalPaymentCommand(prId), ct);
        return NoContent();
    }

    public record UploadBillRequest(long? PoId, long VendorId, string VendorInvoiceRef, DateOnly InvoiceDate, decimal Total, long DocumentId);
}
