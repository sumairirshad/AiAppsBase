using GbpDashboard.Api.Models;
using GbpDashboard.Api.Options;
using GbpDashboard.Api.Seed;
using Microsoft.Extensions.Options;

namespace GbpDashboard.Api.Repositories;

public class InMemoryBusinessProfileRepository : IBusinessProfileRepository
{
    private readonly MockDataSettings _mockDataSettings;
    private BusinessProfile _profile = SeedData.CreateBusinessProfile();
    private readonly object _lock = new();

    public InMemoryBusinessProfileRepository(IOptions<MockDataSettings> mockDataSettings)
    {
        _mockDataSettings = mockDataSettings.Value;
    }

    public async Task<BusinessProfile> GetAsync()
    {
        await SimulateLatencyAsync();

        lock (_lock)
        {
            return _profile;
        }
    }

    public async Task<BusinessProfile> UpdateAsync(BusinessProfile profile)
    {
        await SimulateLatencyAsync();

        lock (_lock)
        {
            profile.Id = _profile.Id;
            profile.UpdatedAt = DateTimeOffset.UtcNow;
            _profile = profile;
            return _profile;
        }
    }

    private Task SimulateLatencyAsync()
    {
        return _mockDataSettings.SimulatedLatencyMs > 0
            ? Task.Delay(_mockDataSettings.SimulatedLatencyMs)
            : Task.CompletedTask;
    }
}
