using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Api.Authorization;
using Procurement.Application.Features.Admin;

namespace Procurement.Api.Controllers;

[ApiController]
[Route("api/v1/locations")]
[Authorize]
public class LocationsController : ControllerBase
{
    private readonly ISender _sender;
    public LocationsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<List<LocationDto>>> List(CancellationToken ct) => Ok(await _sender.Send(new ListLocationsQuery(), ct));

    [HttpPost]
    [RequirePermission("ADMIN.LOCATIONS")]
    public async Task<ActionResult<long>> Create(CreateLocationCommand command, CancellationToken ct) => Ok(await _sender.Send(command, ct));

    [HttpPut("{id:long}")]
    [RequirePermission("ADMIN.LOCATIONS")]
    public async Task<IActionResult> Update(long id, UpdateLocationCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest();
        await _sender.Send(command, ct);
        return NoContent();
    }
}
