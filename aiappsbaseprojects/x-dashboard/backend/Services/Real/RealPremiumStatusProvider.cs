using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;
using XDashboard.Api.Services.X;

namespace XDashboard.Api.Services.Real;

/// <summary>
/// Reads the connected account's real subscription/verification state from the X API v2 user
/// object's subscription_type and verified_type fields. Read-only, matching the Premium page's
/// own description: X Premium is purchased and managed on x.com, not through this dashboard.
/// </summary>
public class RealPremiumStatusProvider : IPremiumStatusProvider
{
    private readonly IXApiClient _xApiClient;

    public RealPremiumStatusProvider(IXApiClient xApiClient)
    {
        _xApiClient = xApiClient;
    }

    public async Task<PremiumStatus> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        var user = await _xApiClient.GetMeAsync(cancellationToken);

        var subscriptionType = user.SubscriptionType ?? "None";
        var isSubscribed = !string.Equals(subscriptionType, "None", StringComparison.OrdinalIgnoreCase);

        var verifiedType = user.VerifiedType ?? "none";
        var hasVerifiedType = !string.Equals(verifiedType, "none", StringComparison.OrdinalIgnoreCase);

        return new PremiumStatus
        {
            IsSubscribed = isSubscribed,
            Tier = isSubscribed ? subscriptionType : string.Empty,
            HasVerifiedBadge = user.Verified || hasVerifiedType,
            VerifiedType = hasVerifiedType ? verifiedType : string.Empty,
        };
    }
}
