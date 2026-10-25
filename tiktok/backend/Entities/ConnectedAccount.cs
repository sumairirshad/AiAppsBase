namespace TikTok.Api.Entities;

public class ConnectedAccount
{
    public Guid Id { get; set; }
    public string OpenId { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? BioDescription { get; set; }
    public bool IsVerified { get; set; }
    public long FollowerCount { get; set; }
    public long FollowingCount { get; set; }
    public long LikesCount { get; set; }
    public long VideoCount { get; set; }
    public bool IsBusinessAccount { get; set; }
    public string EncryptedAccessToken { get; set; } = string.Empty;
    public string EncryptedRefreshToken { get; set; } = string.Empty;
    public DateTimeOffset AccessTokenExpiresAt { get; set; }
    public DateTimeOffset RefreshTokenExpiresAt { get; set; }
    public string GrantedScopes { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset ConnectedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<PublishingJob> PublishingJobs { get; set; } = new List<PublishingJob>();
    public ICollection<VideoStatsSnapshot> StatsSnapshots { get; set; } = new List<VideoStatsSnapshot>();
}
