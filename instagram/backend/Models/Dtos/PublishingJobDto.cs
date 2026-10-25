using Instagram.Api.Entities;

namespace Instagram.Api.Models.Dtos;

public record PublishingJobDto(
    Guid Id,
    Guid ConnectedAccountId,
    InstagramContentType ContentType,
    string? Caption,
    string? Hashtags,
    PublishingJobStatus Status,
    string? PlatformMediaId,
    string? ErrorMessage,
    int AttemptCount,
    DateTimeOffset? ScheduledAt,
    DateTimeOffset? PublishedAt,
    DateTimeOffset CreatedAt,
    IReadOnlyList<MediaAssetDto> MediaAssets);

public record MediaAssetDto(Guid Id, string Url, InstagramMediaKind MediaKind, int SortOrder);
