using System.ComponentModel.DataAnnotations;
using TikTok.Api.Entities;

namespace TikTok.Api.Models.Dtos;

public class CreatePublishingJobRequest
{
    [Required]
    public Guid ConnectedAccountId { get; set; }

    [Required]
    public ContentType ContentType { get; set; }

    [MaxLength(150)]
    public string? Title { get; set; }

    [Required]
    [MaxLength(2200)]
    public string Caption { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Hashtags { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "At least one media URL is required.")]
    public List<string> MediaUrls { get; set; } = new();

    public PostVisibility RequestedVisibility { get; set; } = PostVisibility.SelfOnly;

    public bool RequestDirectPost { get; set; } = true;

    public DateTimeOffset? ScheduledAt { get; set; }
}

public record MediaAssetDto(Guid Id, string MediaType, string SourceUrl, int Order);

public record PublishingJobDto(
    Guid Id,
    Guid ConnectedAccountId,
    string ContentType,
    string? Title,
    string Caption,
    string? Hashtags,
    string RequestedVisibility,
    bool RequestDirectPost,
    string Status,
    string? TikTokPublishId,
    string? PublishedPostId,
    string? ErrorMessage,
    int AttemptCount,
    DateTimeOffset? ScheduledAt,
    DateTimeOffset? PublishedAt,
    DateTimeOffset CreatedAt,
    IReadOnlyList<MediaAssetDto> MediaAssets
);
