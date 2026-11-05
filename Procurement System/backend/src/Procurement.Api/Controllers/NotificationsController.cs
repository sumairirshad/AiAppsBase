using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Features.Alerts;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly ISender _sender;
    public NotificationsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<List<NotificationDto>>> List([FromQuery] bool unreadOnly = false, CancellationToken ct = default) =>
        Ok(await _sender.Send(new ListMyNotificationsQuery(unreadOnly), ct));

    [HttpPost("{id:long}/read")]
    public async Task<IActionResult> MarkRead(long id, CancellationToken ct)
    {
        await _sender.Send(new MarkNotificationReadCommand(id), ct);
        return NoContent();
    }
}
