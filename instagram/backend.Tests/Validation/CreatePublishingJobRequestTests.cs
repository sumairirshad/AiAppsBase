using System.ComponentModel.DataAnnotations;
using Instagram.Api.Entities;
using Instagram.Api.Models.Requests;
using Xunit;

namespace Instagram.Api.Tests.Validation;

public class CreatePublishingJobRequestTests
{
    private static List<ValidationResult> Validate(CreatePublishingJobRequest request)
    {
        var context = new ValidationContext(request);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(request, context, results, validateAllProperties: true);
        results.AddRange(request.Validate(context));
        return results;
    }

    [Fact]
    public void NonCarouselWithMultipleAssets_IsInvalid()
    {
        var request = new CreatePublishingJobRequest
        {
            ConnectedAccountId = Guid.NewGuid(),
            ContentType = InstagramContentType.Image,
            MediaAssets =
            [
                new MediaAssetInput { Url = "https://example.com/1.jpg", MediaKind = InstagramMediaKind.Image },
                new MediaAssetInput { Url = "https://example.com/2.jpg", MediaKind = InstagramMediaKind.Image }
            ]
        };

        var results = Validate(request);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreatePublishingJobRequest.MediaAssets)));
    }

    [Fact]
    public void Carousel_WithSingleAsset_IsInvalid()
    {
        var request = new CreatePublishingJobRequest
        {
            ConnectedAccountId = Guid.NewGuid(),
            ContentType = InstagramContentType.Carousel,
            MediaAssets = [new MediaAssetInput { Url = "https://example.com/1.jpg", MediaKind = InstagramMediaKind.Image }]
        };

        var results = Validate(request);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreatePublishingJobRequest.MediaAssets)));
    }

    [Fact]
    public void Carousel_WithTwoAssets_IsValid()
    {
        var request = new CreatePublishingJobRequest
        {
            ConnectedAccountId = Guid.NewGuid(),
            ContentType = InstagramContentType.Carousel,
            MediaAssets =
            [
                new MediaAssetInput { Url = "https://example.com/1.jpg", MediaKind = InstagramMediaKind.Image },
                new MediaAssetInput { Url = "https://example.com/2.jpg", MediaKind = InstagramMediaKind.Image }
            ]
        };

        var results = Validate(request);

        Assert.Empty(results);
    }

    [Fact]
    public void ScheduledAt_InThePast_IsInvalid()
    {
        var request = new CreatePublishingJobRequest
        {
            ConnectedAccountId = Guid.NewGuid(),
            ContentType = InstagramContentType.Image,
            MediaAssets = [new MediaAssetInput { Url = "https://example.com/1.jpg", MediaKind = InstagramMediaKind.Image }],
            ScheduledAt = DateTimeOffset.UtcNow.AddHours(-1)
        };

        var results = Validate(request);

        Assert.Contains(results, r => r.MemberNames.Contains(nameof(CreatePublishingJobRequest.ScheduledAt)));
    }
}
