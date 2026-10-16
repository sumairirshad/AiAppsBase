using GbpDashboard.Api.Models;
using GbpDashboard.Api.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace GbpDashboard.Api.Controllers;

[ApiController]
[Route("api/business-profile")]
public class BusinessProfileController : ControllerBase
{
    private readonly IBusinessProfileRepository _repository;

    public BusinessProfileController(IBusinessProfileRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<BusinessProfile>> Get()
    {
        var profile = await _repository.GetAsync();
        return Ok(profile);
    }

    [HttpPut]
    public async Task<ActionResult<BusinessProfile>> Update([FromBody] BusinessProfile profile)
    {
        var updated = await _repository.UpdateAsync(profile);
        return Ok(updated);
    }
}
