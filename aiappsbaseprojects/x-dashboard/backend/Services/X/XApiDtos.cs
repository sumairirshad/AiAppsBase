using System.Text.Json.Serialization;

namespace XDashboard.Api.Services.X;

/// <summary>
/// Wire DTOs for the subset of the X API v2 / v1.1 response shapes this app consumes. Kept
/// separate from the app's own domain Models (Models/*.cs) so the mapping from "what X actually
/// returns" to "what the dashboard displays" lives in one obvious place (the Real* stores).
/// </summary>
public class XApiEnvelope<T>
{
    [JsonPropertyName("data")]
    public T? Data { get; set; }

    [JsonPropertyName("includes")]
    public XIncludes? Includes { get; set; }

    [JsonPropertyName("meta")]
    public XMeta? Meta { get; set; }

    [JsonPropertyName("errors")]
    public List<XErrorDetail>? Errors { get; set; }
}

public class XIncludes
{
    [JsonPropertyName("media")]
    public List<XMedia>? Media { get; set; }

    [JsonPropertyName("tweets")]
    public List<XTweet>? Tweets { get; set; }
}

public class XMeta
{
    [JsonPropertyName("next_token")]
    public string? NextToken { get; set; }

    [JsonPropertyName("result_count")]
    public int ResultCount { get; set; }
}

public class XErrorDetail
{
    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("detail")]
    public string? Detail { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("code")]
    public int? Code { get; set; }
}

public class XUser
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("location")]
    public string? Location { get; set; }

    [JsonPropertyName("url")]
    public string? Url { get; set; }

    [JsonPropertyName("profile_image_url")]
    public string? ProfileImageUrl { get; set; }

    [JsonPropertyName("profile_banner_url")]
    public string? ProfileBannerUrl { get; set; }

    [JsonPropertyName("verified")]
    public bool Verified { get; set; }

    [JsonPropertyName("verified_type")]
    public string? VerifiedType { get; set; }

    [JsonPropertyName("subscription_type")]
    public string? SubscriptionType { get; set; }

    [JsonPropertyName("pinned_tweet_id")]
    public string? PinnedTweetId { get; set; }

    [JsonPropertyName("created_at")]
    public DateTimeOffset? CreatedAt { get; set; }

    [JsonPropertyName("public_metrics")]
    public XUserPublicMetrics? PublicMetrics { get; set; }
}

public class XUserPublicMetrics
{
    [JsonPropertyName("followers_count")]
    public int FollowersCount { get; set; }

    [JsonPropertyName("following_count")]
    public int FollowingCount { get; set; }

    [JsonPropertyName("tweet_count")]
    public int TweetCount { get; set; }

    [JsonPropertyName("listed_count")]
    public int ListedCount { get; set; }
}

public class XTweet
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; }

    [JsonPropertyName("public_metrics")]
    public XTweetPublicMetrics? PublicMetrics { get; set; }

    [JsonPropertyName("attachments")]
    public XTweetAttachments? Attachments { get; set; }
}

public class XTweetPublicMetrics
{
    [JsonPropertyName("like_count")]
    public int LikeCount { get; set; }

    [JsonPropertyName("retweet_count")]
    public int RetweetCount { get; set; }

    [JsonPropertyName("reply_count")]
    public int ReplyCount { get; set; }

    [JsonPropertyName("impression_count")]
    public int ImpressionCount { get; set; }
}

public class XTweetAttachments
{
    [JsonPropertyName("media_keys")]
    public List<string>? MediaKeys { get; set; }
}

public class XMedia
{
    [JsonPropertyName("media_key")]
    public string MediaKey { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("url")]
    public string? Url { get; set; }

    [JsonPropertyName("preview_image_url")]
    public string? PreviewImageUrl { get; set; }

    [JsonPropertyName("duration_ms")]
    public int? DurationMs { get; set; }

    [JsonPropertyName("variants")]
    public List<XMediaVariant>? Variants { get; set; }
}

public class XMediaVariant
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("bit_rate")]
    public int? BitRate { get; set; }

    [JsonPropertyName("content_type")]
    public string? ContentType { get; set; }
}

public class XCreatedTweetResponse
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;
}

public class XMediaUploadInitResponse
{
    [JsonPropertyName("data")]
    public XMediaUploadData? Data { get; set; }
}

public class XMediaUploadData
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("media_key")]
    public string? MediaKey { get; set; }

    [JsonPropertyName("expires_after_secs")]
    public int ExpiresAfterSecs { get; set; }

    [JsonPropertyName("processing_info")]
    public XMediaProcessingInfo? ProcessingInfo { get; set; }
}

public class XMediaProcessingInfo
{
    [JsonPropertyName("state")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("check_after_secs")]
    public int? CheckAfterSecs { get; set; }

    [JsonPropertyName("progress_percent")]
    public int? ProgressPercent { get; set; }

    [JsonPropertyName("error")]
    public XErrorDetail? Error { get; set; }
}
