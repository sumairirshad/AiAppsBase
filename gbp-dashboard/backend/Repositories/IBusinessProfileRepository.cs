using GbpDashboard.Api.Models;

namespace GbpDashboard.Api.Repositories;

public interface IBusinessProfileRepository
{
    Task<BusinessProfile> GetAsync();
    Task<BusinessProfile> UpdateAsync(BusinessProfile profile);
}
