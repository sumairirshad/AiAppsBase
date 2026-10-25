using System.Text.Json.Serialization;

namespace TikTok.Api.Models.TikTok;

public class TikTokUserInfoEnvelope
{
    [JsonPropertyName("data")]
    public TikTokUserInfoData Data { get; set; } = new();

    [JsonPropertyName("error")]
    public TikTokApiError Error { get; set; } = new();
}

public class TikTokUserInfoData
{
    [JsonPropertyName("user")]
    public TikTokUser User { get; set; } = new();
}

public class TikTokUser
{
    [JsonPropertyName("open_id")]
    public string OpenId { get; set; } = string.Empty;

    [JsonPropertyName("union_id")]
    public string? UnionId { get; set; }

    [JsonPropertyName("display_name")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("username")]
    public string? Username { get; set; }

    [JsonPropertyName("avatar_url")]
    public string? AvatarUrl { get; set; }

    [JsonPropertyName("bio_description")]
    public string? BioDescription { get; set; }

    [JsonPropertyName("is_verified")]
    public bool IsVerified { get; set; }

    [JsonPropertyName("follower_count")]
    public long FollowerCount { get; set; }

    [JsonPropertyName("following_count")]
    public long FollowingCount { get; set; }

    [JsonPropertyName("likes_count")]
    public long LikesCount { get; set; }

    [JsonPropertyName("video_count")]
    public long VideoCount { get; set; }
}

public class TikTokApiError
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("log_id")]
    public string? LogId { get; set; }
}
