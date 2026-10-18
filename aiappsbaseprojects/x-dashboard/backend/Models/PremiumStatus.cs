namespace XDashboard.Api.Models;

/// <summary>
/// Derived from the X API v2 user object's subscription_type and verified_type fields (see
/// https://docs.x.com/x-api/fundamentals/user-object). X does not expose subscription start
/// date, renewal date, or a benefits list over the API -- those fields are intentionally absent
/// here rather than fabricated. See the Premium page for how this is presented.
/// </summary>
public class PremiumStatus
{
    public bool IsSubscribed { get; set; }

    /// <summary>"Basic", "Premium", "PremiumPlus", or "" when not subscribed.</summary>
    public string Tier { get; set; } = string.Empty;
    public bool HasVerifiedBadge { get; set; }

    /// <summary>"blue", "business", "government", or "" -- X's verification category, which is
    /// related to but distinct from the Premium subscription tier.</summary>
    public string VerifiedType { get; set; } = string.Empty;
}
