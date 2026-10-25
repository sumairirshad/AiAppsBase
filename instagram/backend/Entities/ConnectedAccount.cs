namespace Instagram.Api.Entities;

public class ConnectedAccount
{
    public Guid Id { get; set; }
    public required string PlatformUserId { get; set; }
    public required string Username { get; set; }
    public string? DisplayName { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? AccountType { get; set; }
    public string? Biography { get; set; }
    public string? Website { get; set; }
    public int? FollowersCount { get; set; }
    public int? MediaCount { get; set; }
    public required string EncryptedAccessToken { get; set; }
    public DateTimeOffset TokenExpiresAt { get; set; }
    public required string GrantedScopes { get; set; }
    public DateTimeOffset ConnectedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<PublishingJob> PublishingJobs { get; set; } = new List<PublishingJob>();
    public ICollection<InsightsSnapshot> InsightsSnapshots { get; set; } = new List<InsightsSnapshot>();
}
