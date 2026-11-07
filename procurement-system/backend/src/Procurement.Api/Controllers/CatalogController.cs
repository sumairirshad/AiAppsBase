using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procurement.Application.Catalog;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/catalog")]
public class CatalogController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public CatalogController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet("departments")]
    public async Task<ActionResult<List<DepartmentDto>>> Departments(CancellationToken ct) => await _mediator.Send(new ListDepartmentsQuery(), ct);

    [HttpPost("departments")]
    public async Task<ActionResult<long>> CreateDepartment(CreateDepartmentRequest body, CancellationToken ct) =>
        await _mediator.Send(new CreateDepartmentCommand(_currentUser.UserId, body.Code, body.Name, body.ParentId), ct);

    [HttpGet("locations")]
    public async Task<ActionResult<List<LocationDto>>> Locations(CancellationToken ct) => await _mediator.Send(new ListLocationsQuery(), ct);

    [HttpPost("locations")]
    public async Task<ActionResult<long>> CreateLocation(CreateLocationRequest body, CancellationToken ct) =>
        await _mediator.Send(new CreateLocationCommand(_currentUser.UserId, body.Code, body.Name, body.Address), ct);

    [HttpPut("locations/{id:long}")]
    public async Task<IActionResult> UpdateLocation(long id, UpdateLocationRequest body, CancellationToken ct)
    {
        await _mediator.Send(new UpdateLocationCommand(_currentUser.UserId, id, body.Name, body.Address, body.IsActive), ct);
        return NoContent();
    }

    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> Categories(CancellationToken ct) => await _mediator.Send(new ListCategoriesQuery(), ct);

    [HttpPost("categories")]
    public async Task<ActionResult<long>> CreateCategory(CreateCategoryCommand body, CancellationToken ct) =>
        await _mediator.Send(body with { ActorUserId = _currentUser.UserId }, ct);

    [HttpPost("department-categories")]
    public async Task<IActionResult> MapDepartmentCategory(MapDepartmentCategoryCommand body, CancellationToken ct)
    {
        await _mediator.Send(body with { ActorUserId = _currentUser.UserId }, ct);
        return NoContent();
    }

    [HttpGet("units")]
    public async Task<ActionResult<List<UnitDto>>> Units(CancellationToken ct) => await _mediator.Send(new ListUnitsQuery(), ct);

    [HttpPost("units")]
    public async Task<ActionResult<long>> CreateUnit(CreateUnitCommand body, CancellationToken ct) =>
        await _mediator.Send(body with { ActorUserId = _currentUser.UserId }, ct);

    [HttpGet("items")]
    public async Task<ActionResult<List<ItemDto>>> Items([FromQuery] long? departmentId, [FromQuery] long? categoryId, CancellationToken ct) =>
        await _mediator.Send(new ListItemsQuery(departmentId, categoryId), ct);

    [HttpPost("items")]
    public async Task<ActionResult<long>> CreateItem(CreateItemCommand body, CancellationToken ct) =>
        await _mediator.Send(body with { ActorUserId = _currentUser.UserId }, ct);

    [HttpPost("item-requests")]
    public async Task<ActionResult<long>> CreateItemRequest(CreateItemRequestCommand body, CancellationToken ct) =>
        await _mediator.Send(body with { ActorUserId = _currentUser.UserId }, ct);

    [HttpGet("item-requests/pending")]
    public async Task<ActionResult<List<ItemRequestDto>>> PendingItemRequests(CancellationToken ct) =>
        await _mediator.Send(new ListPendingItemRequestsQuery(), ct);

    [HttpPost("item-requests/{id:long}/decision")]
    public async Task<IActionResult> DecideItemRequest(long id, DecideItemRequestBody body, CancellationToken ct)
    {
        await _mediator.Send(new DecideItemRequestCommand(_currentUser.UserId, id, body.Approve, body.Reason, body.UnitId), ct);
        return NoContent();
    }

    [HttpGet("projects")]
    public async Task<ActionResult<List<ProjectDto>>> Projects(CancellationToken ct) => await _mediator.Send(new ListProjectsQuery(), ct);

    [HttpPost("projects")]
    public async Task<ActionResult<long>> CreateProject(CreateProjectRequest body, CancellationToken ct) =>
        await _mediator.Send(new CreateProjectCommand(_currentUser.UserId, body.ProjectCode, body.Name, body.OwnerDepartmentId, body.ManagerUserId, body.ContractProvided), ct);

    [HttpPost("market-surveys")]
    public async Task<ActionResult<long>> CreateMarketSurvey(CreateMarketSurveyRequest body, CancellationToken ct) =>
        await _mediator.Send(new CreateMarketSurveyCommand(_currentUser.UserId, body.ItemId, body.LocationId, body.SurveyedPrice, body.Source, body.SurveyedOn), ct);
}

public record CreateDepartmentRequest(string Code, string Name, long? ParentId);
public record CreateLocationRequest(string Code, string Name, string? Address);
public record UpdateLocationRequest(string Name, string? Address, bool IsActive);
public record DecideItemRequestBody(bool Approve, string? Reason, long? UnitId);
public record CreateProjectRequest(string ProjectCode, string Name, long OwnerDepartmentId, long? ManagerUserId, bool ContractProvided);
public record CreateMarketSurveyRequest(long ItemId, long? LocationId, decimal SurveyedPrice, string Source, DateOnly SurveyedOn);
