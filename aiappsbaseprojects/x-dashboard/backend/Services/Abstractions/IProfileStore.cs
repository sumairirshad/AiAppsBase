using XDashboard.Api.Models;

namespace XDashboard.Api.Services.Abstractions;

public interface IProfileStore
{
    Task<Profile> GetProfileAsync(CancellationToken cancellationToken = default);
    Task<Profile> UpdateProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default);
}
