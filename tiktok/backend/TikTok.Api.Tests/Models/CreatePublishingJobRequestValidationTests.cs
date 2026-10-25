using System.ComponentModel.DataAnnotations;
using TikTok.Api.Entities;
using TikTok.Api.Models.Dtos;

namespace TikTok.Api.Tests.Models;

public class CreatePublishingJobRequestValidationTests
{
    private static List<ValidationResult> Validate(CreatePublishingJobRequest request)
    {
        var context = new ValidationContext(request);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(request, context, results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public void Validate_WithNoMediaUrls_Fails()
    {
        var request = new CreatePublishingJobRequest
        {
            ConnectedAccountId = Guid.NewGuid(),
            ContentType = ContentType.Video,
            Caption = "caption",
            MediaUrls = new List<string>()
        };

        var results = Validate(request);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreatePublishingJobRequest.MediaUrls)));
    }

    [Fact]
    public void Validate_WithCaptionTooLong_Fails()
    {
        var request = new CreatePublishingJobRequest
        {
            ConnectedAccountId = Guid.NewGuid(),
            ContentType = ContentType.Video,
            Caption = new string('a', 2201),
            MediaUrls = new List<string> { "https://example.com/video.mp4" }
        };

        var results = Validate(request);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreatePublishingJobRequest.Caption)));
    }

    [Fact]
    public void Validate_WithValidRequest_Passes()
    {
        var request = new CreatePublishingJobRequest
        {
            ConnectedAccountId = Guid.NewGuid(),
            ContentType = ContentType.PhotoPost,
            Caption = "A valid caption",
            MediaUrls = new List<string> { "https://example.com/photo.jpg" }
        };

        var results = Validate(request);

        Assert.Empty(results);
    }
}
