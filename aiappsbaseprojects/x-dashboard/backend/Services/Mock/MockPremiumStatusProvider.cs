using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Services.Mock;

public class MockPremiumStatusProvider : IPremiumStatusProvider
{
    private readonly PremiumStatus _status;

    public MockPremiumStatusProvider(SeedDataLoader seedDataLoader)
    {
        _status = seedDataLoader.Load<PremiumStatus>("premium-status.json");
    }

    public Task<PremiumStatus> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(_status);
    }
}
