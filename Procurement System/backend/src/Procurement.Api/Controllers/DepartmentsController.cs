using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Api.Authorization;
using Procurement.Application.Features.Admin;

namespace Procurement.Api.Controllers;

[ApiController]
[Route("api/v1/departments")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly ISender _sender;
    public DepartmentsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<List<DepartmentDto>>> List(CancellationToken ct) => Ok(await _sender.Send(new ListDepartmentsQuery(), ct));

    [HttpPost]
    [RequirePermission("ADMIN.USERS")]
    public async Task<ActionResult<long>> Create(CreateDepartmentCommand command, CancellationToken ct) => Ok(await _sender.Send(command, ct));

    [HttpPut("{id:long}")]
    [RequirePermission("ADMIN.USERS")]
    public async Task<IActionResult> Update(long id, UpdateDepartmentCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest();
        await _sender.Send(command, ct);
        return NoContent();
    }

    [HttpGet("{departmentId:long}/categories")]
    public async Task<ActionResult<List<DepartmentCategoryDto>>> ListCategories(long departmentId, CancellationToken ct) =>
        Ok(await _sender.Send(new ListDepartmentCategoriesQuery(departmentId), ct));

    [HttpPut("{departmentId:long}/categories")]
    [RequirePermission("ADMIN.POLICY")]
    public async Task<IActionResult> SetCategories(long departmentId, [FromBody] List<long> categoryIds, CancellationToken ct)
    {
        await _sender.Send(new SetDepartmentCategoriesCommand(departmentId, categoryIds), ct);
        return NoContent();
    }
}
