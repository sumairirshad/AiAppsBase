using System.ComponentModel.DataAnnotations;
using Instagram.Api.Entities;

namespace Instagram.Api.Models.Requests;

public class CreatePublishingJobRequest : IValidatableObject
{
    [Required]
    public Guid ConnectedAccountId { get; set; }

    [Required]
    public InstagramContentType ContentType { get; set; }

    [MaxLength(2200)]
    public string? Caption { get; set; }

    [MaxLength(500)]
    public string? Hashtags { get; set; }

    [Required]
    [MinLength(1)]
    public List<MediaAssetInput> MediaAssets { get; set; } = [];

    public DateTimeOffset? ScheduledAt { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ContentType != InstagramContentType.Carousel && MediaAssets.Count > 1)
        {
            yield return new ValidationResult(
                "Only Carousel content type supports multiple media assets.",
                [nameof(MediaAssets)]);
        }

        if (ContentType == InstagramContentType.Carousel && MediaAssets.Count is < 2 or > 10)
        {
            yield return new ValidationResult(
                "Carousel posts require between 2 and 10 media assets.",
                [nameof(MediaAssets)]);
        }

        if (ScheduledAt is not null && ScheduledAt < DateTimeOffset.UtcNow.AddMinutes(-1))
        {
            yield return new ValidationResult(
                "ScheduledAt must be in the future.",
                [nameof(ScheduledAt)]);
        }
    }
}

public class MediaAssetInput
{
    [Required]
    [Url]
    public required string Url { get; set; }

    [Required]
    public InstagramMediaKind MediaKind { get; set; }
}
