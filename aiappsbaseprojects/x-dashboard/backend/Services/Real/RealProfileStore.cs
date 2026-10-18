using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;
using XDashboard.Api.Services.X;

namespace XDashboard.Api.Services.Real;

/// <summary>
/// Backs the Profile page with the real, connected X account via GET /2/users/me and the legacy
/// v1.1 POST account/update_profile endpoint (v2 has no profile-text write endpoint). See the
/// Profile model for which fields the X API does not expose at all.
/// </summary>
public class RealProfileStore : IProfileStore
{
    private readonly IXApiClient _xApiClient;

    public RealProfileStore(IXApiClient xApiClient)
    {
        _xApiClient = xApiClient;
    }

    public async Task<Profile> GetProfileAsync(CancellationToken cancellationToken = default)
    {
        var user = await _xApiClient.GetMeAsync(cancellationToken);
        return MapToProfile(user);
    }

    public async Task<Profile> UpdateProfileAsync(UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var bio = request.Bio.Length > 160 ? request.Bio[..160] : request.Bio;

        await _xApiClient.UpdateLegacyProfileAsync(
            new LegacyProfileFields(request.DisplayName, request.Website, request.Location, bio),
            cancellationToken);

        var user = await _xApiClient.GetMeAsync(cancellationToken);

        if (!string.Equals(request.PinnedPostId, user.PinnedTweetId, StringComparison.Ordinal))
        {
            if (!string.IsNullOrEmpty(user.PinnedTweetId))
            {
                await _xApiClient.UnpinTweetAsync(user.Id, user.PinnedTweetId, cancellationToken);
            }

            if (!string.IsNullOrEmpty(request.PinnedPostId))
            {
                await _xApiClient.PinTweetAsync(user.Id, request.PinnedPostId, cancellationToken);
            }

            user = await _xApiClient.GetMeAsync(cancellationToken);
        }

        return MapToProfile(user);
    }

    internal static Profile MapToProfile(XUser user)
    {
        var verifiedType = user.VerifiedType ?? "none";

        return new Profile
        {
            Handle = user.Username,
            DisplayName = user.Name,
            Bio = user.Description ?? string.Empty,
            ProfilePictureUrl = user.ProfileImageUrl ?? string.Empty,
            CoverImageUrl = user.ProfileBannerUrl ?? string.Empty,
            AccountType = string.Equals(verifiedType, "business", StringComparison.OrdinalIgnoreCase)
                ? AccountType.Business
                : AccountType.Personal,
            Category = string.Empty,
            Phone = string.Empty,
            Email = string.Empty,
            Location = user.Location ?? string.Empty,
            Website = user.Url ?? string.Empty,
            PinnedPostId = user.PinnedTweetId,
            JoinedAt = user.CreatedAt ?? DateTimeOffset.MinValue,
            FollowersCount = user.PublicMetrics?.FollowersCount ?? 0,
            FollowingCount = user.PublicMetrics?.FollowingCount ?? 0,
        };
    }
}
