using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.FinancePortal;

namespace Procurement.Api.Controllers;

// The real Finance Portal calls POST /callback with its own authentication (configure a
// shared secret / mTLS in production - left as an extension point here). /simulate is a
// dev-only convenience so the whole loop can be demoed without that external system; it is
// disabled outside Development.
[ApiController]
[Route("api/v1/finance-portal")]
public class FinancePortalController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IWebHostEnvironment _env;

    public FinancePortalController(IMediator mediator, IWebHostEnvironment env)
    {
        _mediator = mediator;
        _env = env;
    }

    [HttpPost("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback(PaymentCallbackCommand body, CancellationToken ct)
    {
        await _mediator.Send(body, ct);
        return NoContent();
    }

    [HttpPost("simulate/{invoiceId:long}")]
    [Authorize]
    public async Task<ActionResult<PaymentCallbackCommand>> Simulate(long invoiceId, [FromQuery] decimal? partialAmount, CancellationToken ct)
    {
        if (!_env.IsDevelopment()) return NotFound();
        return await _mediator.Send(new SimulatePaymentCommand(invoiceId, partialAmount), ct);
    }
}
