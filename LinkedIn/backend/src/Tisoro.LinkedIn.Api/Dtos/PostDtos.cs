using System.ComponentModel.DataAnnotations;
using Tisoro.LinkedIn.Api.Models;

namespace Tisoro.LinkedIn.Api.Dtos;

public class CreatePostRequest
{
    [Required]
    public PostContentType ContentType { get; set; }

    [MaxLength(255)]
    public string? Title { get; set; }

    [Required, MaxLength(3000)]
    public string Body { get; set; } = "";

    [MaxLength(2000)]
    [Url]
    public string? ExternalLinkUrl { get; set; }

    public Guid? CaptionTemplateId { get; set; }

    public DateTimeOffset? ScheduledAt { get; set; }

    /// <summary>Media asset IDs in display order. Image=1, MultiImage=2-20, Video=1, Document=1, required.</summary>
    public List<Guid> MediaAssetIds { get; set; } = new();
}

public sealed class UpdatePostRequest : CreatePostRequest { }

public sealed class PostResponse
{
    public Guid Id { get; set; }
    public PostContentType ContentType { get; set; }
    public PostStatus Status { get; set; }
    public string? Title { get; set; }
    public string Body { get; set; } = "";
    public string? ExternalLinkUrl { get; set; }
    public Guid? CaptionTemplateId { get; set; }
    public DateTimeOffset? ScheduledAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public string? LinkedInPostUrn { get; set; }
    public string? PublishError { get; set; }
    public int PublishAttempts { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<MediaAssetResponse> Media { get; set; } = new();

    public static PostResponse FromEntity(Post post) => new()
    {
        Id = post.Id,
        ContentType = post.ContentType,
        Status = post.Status,
        Title = post.Title,
        Body = post.Body,
        ExternalLinkUrl = post.ExternalLinkUrl,
        CaptionTemplateId = post.CaptionTemplateId,
        ScheduledAt = post.ScheduledAt,
        PublishedAt = post.PublishedAt,
        LinkedInPostUrn = post.LinkedInPostUrn,
        PublishError = post.PublishError,
        PublishAttempts = post.PublishAttempts,
        CreatedAt = post.CreatedAt,
        UpdatedAt = post.UpdatedAt,
        Media = post.Media
            .OrderBy(m => m.SortOrder)
            .Select(m => MediaAssetResponse.FromEntity(m.MediaAsset))
            .ToList(),
    };
}

public sealed class MediaAssetResponse
{
    public Guid Id { get; set; }
    public MediaKind Kind { get; set; }
    public string OriginalFileName { get; set; } = "";
    public string ContentType { get; set; } = "";
    public long SizeBytes { get; set; }
    public DateTimeOffset UploadedAt { get; set; }

    public static MediaAssetResponse FromEntity(MediaAsset asset) => new()
    {
        Id = asset.Id,
        Kind = asset.Kind,
        OriginalFileName = asset.OriginalFileName,
        ContentType = asset.ContentType,
        SizeBytes = asset.SizeBytes,
        UploadedAt = asset.UploadedAt,
    };
}
