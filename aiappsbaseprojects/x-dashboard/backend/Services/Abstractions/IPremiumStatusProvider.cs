using XDashboard.Api.Models;

namespace XDashboard.Api.Services.Abstractions;

public interface IPremiumStatusProvider
{
    Task<PremiumStatus> GetStatusAsync(CancellationToken cancellationToken = default);
}
