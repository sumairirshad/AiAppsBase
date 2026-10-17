using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;

namespace XDashboard.Api.Services.Mock;

public class InMemoryProfileStore : IProfileStore
{
    private readonly object _lock = new();
    private Profile _profile;

    public InMemoryProfileStore(SeedDataLoader seedDataLoader)
    {
        _profile = seedDataLoader.Load<Profile>("profile.json");
    }

    public Task<Profile> GetProfileAsync(CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            return Task.FromResult(Clone(_profile));
        }
    }

    public Task<Profile> UpdateProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            _profile.DisplayName = request.DisplayName;
            _profile.Bio = request.Bio.Length > 160 ? request.Bio[..160] : request.Bio;
            _profile.ProfilePictureUrl = request.ProfilePictureUrl;
            _profile.CoverImageUrl = request.CoverImageUrl;
            _profile.AccountType = request.AccountType;
            _profile.Category = request.Category;
            _profile.Phone = request.Phone;
            _profile.Email = request.Email;
            _profile.Location = request.Location;
            _profile.Website = request.Website;
            _profile.PinnedPostId = request.PinnedPostId;
            return Task.FromResult(Clone(_profile));
        }
    }

    private static Profile Clone(Profile profile)
    {
        return new Profile
        {
            Handle = profile.Handle,
            DisplayName = profile.DisplayName,
            Bio = profile.Bio,
            ProfilePictureUrl = profile.ProfilePictureUrl,
            CoverImageUrl = profile.CoverImageUrl,
            AccountType = profile.AccountType,
            Category = profile.Category,
            Phone = profile.Phone,
            Email = profile.Email,
            Location = profile.Location,
            Website = profile.Website,
            PinnedPostId = profile.PinnedPostId,
            JoinedAt = profile.JoinedAt
        };
    }
}
