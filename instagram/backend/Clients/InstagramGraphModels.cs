using System.Text.Json.Serialization;

namespace Instagram.Api.Clients;

public record ShortLivedTokenResponse(
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("user_id")] string UserId);

public record LongLivedTokenResponse(
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("token_type")] string TokenType,
    [property: JsonPropertyName("expires_in")] long ExpiresInSeconds);

public record InstagramProfile(
    [property: JsonPropertyName("user_id")] string UserId,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("account_type")] string? AccountType,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("profile_picture_url")] string? ProfilePictureUrl,
    [property: JsonPropertyName("biography")] string? Biography,
    [property: JsonPropertyName("website")] string? Website,
    [property: JsonPropertyName("followers_count")] int? FollowersCount,
    [property: JsonPropertyName("media_count")] int? MediaCount);

public record MediaContainerResponse([property: JsonPropertyName("id")] string Id);

public record MediaPublishResponse([property: JsonPropertyName("id")] string Id);

public record ContainerStatusResponse(
    [property: JsonPropertyName("status_code")] string StatusCode,
    [property: JsonPropertyName("id")] string Id);

public record PublishingLimitResponse(
    [property: JsonPropertyName("data")] List<PublishingLimitEntry> Data);

public record PublishingLimitEntry(
    [property: JsonPropertyName("quota_usage")] int QuotaUsage,
    [property: JsonPropertyName("config")] PublishingLimitConfig Config);

public record PublishingLimitConfig(
    [property: JsonPropertyName("quota_total")] int QuotaTotal,
    [property: JsonPropertyName("quota_duration")] int QuotaDuration);

public record InsightsResponse([property: JsonPropertyName("data")] List<InsightsMetric> Data);

public record InsightsMetric(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("period")] string? Period,
    [property: JsonPropertyName("values")] List<InsightsValue>? Values,
    [property: JsonPropertyName("total_value")] InsightsTotalValue? TotalValue);

public record InsightsValue([property: JsonPropertyName("value")] long Value);

public record InsightsTotalValue([property: JsonPropertyName("value")] long Value);

public record CommentsResponse([property: JsonPropertyName("data")] List<InstagramComment> Data);

public record InstagramComment(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("text")] string Text,
    [property: JsonPropertyName("username")] string? Username,
    [property: JsonPropertyName("timestamp")] DateTimeOffset? Timestamp,
    [property: JsonPropertyName("hidden")] bool? Hidden);

public record GraphErrorEnvelope([property: JsonPropertyName("error")] GraphError? Error);

public record GraphError(
    [property: JsonPropertyName("message")] string Message,
    [property: JsonPropertyName("type")] string? Type,
    [property: JsonPropertyName("code")] int? Code,
    [property: JsonPropertyName("error_subcode")] int? ErrorSubcode);
