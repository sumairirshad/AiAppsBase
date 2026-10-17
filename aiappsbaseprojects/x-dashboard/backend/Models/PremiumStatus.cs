namespace XDashboard.Api.Models;

public class PremiumStatus
{
    public bool IsSubscribed { get; set; }
    public string Tier { get; set; } = string.Empty;
    public bool HasVerifiedBadge { get; set; }
    public DateTimeOffset? SubscribedSince { get; set; }
    public DateTimeOffset? RenewsOn { get; set; }
    public List<string> Benefits { get; set; } = new();
}
