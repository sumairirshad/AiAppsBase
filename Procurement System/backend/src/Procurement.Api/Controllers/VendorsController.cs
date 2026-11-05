using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Api.Authorization;
using Procurement.Application.Features.VendorManagement;

namespace Procurement.Api.Controllers;

[ApiController]
[Route("api/v1/vendors")]
[Authorize]
public class VendorsController : ControllerBase
{
    private readonly ISender _sender;
    public VendorsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<List<VendorDto>>> List([FromQuery] long? categoryId, [FromQuery] bool approvedOnly = true, CancellationToken ct = default) =>
        Ok(await _sender.Send(new ListVendorsQuery(categoryId, approvedOnly), ct));

    [HttpPost("{vendorId:long}/blacklist")]
    [RequirePermission("VENDOR.BLACKLIST")]
    public async Task<IActionResult> Blacklist(long vendorId, [FromBody] BlacklistRequest request, CancellationToken ct)
    {
        await _sender.Send(new BlacklistVendorCommand(vendorId, request.Reason), ct);
        return NoContent();
    }

    [HttpPost("registrations")]
    [RequirePermission("VENDOR.REGISTER")]
    public async Task<ActionResult<long>> Register(RegisterVendorCommand command, CancellationToken ct) => Ok(await _sender.Send(command, ct));

    [HttpGet("registrations")]
    public async Task<ActionResult<List<VendorRegistrationRequestDto>>> ListRegistrations([FromQuery] string? status, CancellationToken ct) =>
        Ok(await _sender.Send(new ListVendorRegistrationRequestsQuery(status), ct));

    [HttpPost("registrations/{requestId:long}/procurement-decision")]
    [RequirePermission("VENDOR.DECIDE")]
    public async Task<IActionResult> ProcurementDecision(long requestId, [FromBody] VendorDecisionRequest request, CancellationToken ct)
    {
        await _sender.Send(new ProcurementVendorDecisionCommand(requestId, request.Approve, request.Reason), ct);
        return NoContent();
    }

    [HttpPost("registrations/{requestId:long}/procurement-hod-decision")]
    [RequirePermission("VENDOR.APPROVE")]
    public async Task<IActionResult> ProcurementHodDecision(long requestId, [FromBody] VendorDecisionRequest request, CancellationToken ct)
    {
        await _sender.Send(new ProcurementHodVendorDecisionCommand(requestId, request.Approve, request.Reason), ct);
        return NoContent();
    }

    public record BlacklistRequest(string Reason);
    public record VendorDecisionRequest(bool Approve, string Reason);
}
