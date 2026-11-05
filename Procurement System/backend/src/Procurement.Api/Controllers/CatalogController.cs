using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Features.Admin;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
public class CatalogController : ControllerBase
{
    private readonly ISender _sender;
    public CatalogController(ISender sender) => _sender = sender;

    [HttpGet("api/v1/categories")]
    public async Task<ActionResult<List<CategoryDto>>> ListCategories(CancellationToken ct) => Ok(await _sender.Send(new ListCategoriesQuery(), ct));

    [HttpPost("api/v1/categories")]
    public async Task<ActionResult<long>> CreateCategory(CreateCategoryCommand command, CancellationToken ct) => Ok(await _sender.Send(command, ct));

    [HttpGet("api/v1/items")]
    public async Task<ActionResult<List<ItemDto>>> ListItems([FromQuery] long? categoryId, CancellationToken ct) =>
        Ok(await _sender.Send(new ListItemsQuery(categoryId), ct));

    [HttpPost("api/v1/items")]
    public async Task<ActionResult<long>> CreateItem(CreateItemCommand command, CancellationToken ct) => Ok(await _sender.Send(command, ct));

    [HttpGet("api/v1/units")]
    public async Task<ActionResult<List<UnitDto>>> ListUnits(CancellationToken ct) => Ok(await _sender.Send(new ListUnitsQuery(), ct));
}
