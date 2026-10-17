using XDashboard.Api.Models;

namespace XDashboard.Api.Services.Abstractions;

public interface IDashboardService
{
    Task<DashboardSummary> GetSummaryAsync(CancellationToken cancellationToken = default);
}
