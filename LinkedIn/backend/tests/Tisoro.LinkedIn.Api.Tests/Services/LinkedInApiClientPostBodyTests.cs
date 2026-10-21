using Tisoro.LinkedIn.Api.Models;
using Tisoro.LinkedIn.Api.Services.LinkedIn;
using Xunit;

namespace Tisoro.LinkedIn.Api.Tests.Services;

public class LinkedInApiClientPostBodyTests
{
    [Fact]
    public void Text_post_has_no_content_block()
    {
        var spec = new PostPublishSpec
        {
            AuthorUrn = "urn:li:organization:123",
            ContentType = PostContentType.Text,
            Body = "Hello LinkedIn",
        };

        var body = LinkedInApiClient.BuildPostBody(spec);

        Assert.Equal("urn:li:organization:123", body["author"]!.GetValue<string>());
        Assert.Equal("Hello LinkedIn", body["commentary"]!.GetValue<string>());
        Assert.Equal("PUBLISHED", body["lifecycleState"]!.GetValue<string>());
        Assert.Null(body["content"]);
    }

    [Fact]
    public void Image_post_references_a_single_media_urn()
    {
        var spec = new PostPublishSpec
        {
            AuthorUrn = "urn:li:organization:123",
            ContentType = PostContentType.Image,
            Body = "Caption",
            MediaUrns = new[] { "urn:li:image:abc" },
        };

        var body = LinkedInApiClient.BuildPostBody(spec);

        Assert.Equal("urn:li:image:abc", body["content"]!["media"]!["id"]!.GetValue<string>());
    }

    [Fact]
    public void MultiImage_post_lists_every_image_in_order()
    {
        var spec = new PostPublishSpec
        {
            AuthorUrn = "urn:li:organization:123",
            ContentType = PostContentType.MultiImage,
            Body = "Album caption",
            MediaUrns = new[] { "urn:li:image:1", "urn:li:image:2", "urn:li:image:3" },
        };

        var body = LinkedInApiClient.BuildPostBody(spec);
        var images = body["content"]!["multiImage"]!["images"]!.AsArray();

        Assert.Equal(3, images.Count);
        Assert.Equal("urn:li:image:1", images[0]!["id"]!.GetValue<string>());
        Assert.Equal("urn:li:image:3", images[2]!["id"]!.GetValue<string>());
    }

    [Fact]
    public void Document_post_carries_its_title()
    {
        var spec = new PostPublishSpec
        {
            AuthorUrn = "urn:li:organization:123",
            ContentType = PostContentType.Document,
            Body = "Caption",
            Title = "The Golden Door: A 2026 Field Guide",
            MediaUrns = new[] { "urn:li:document:xyz" },
        };

        var body = LinkedInApiClient.BuildPostBody(spec);

        Assert.Equal("urn:li:document:xyz", body["content"]!["media"]!["id"]!.GetValue<string>());
        Assert.Equal("The Golden Door: A 2026 Field Guide", body["content"]!["media"]!["title"]!.GetValue<string>());
    }

    [Fact]
    public void ArticleLink_post_shares_the_external_url()
    {
        var spec = new PostPublishSpec
        {
            AuthorUrn = "urn:li:organization:123",
            ContentType = PostContentType.ArticleLink,
            Body = "Caption",
            Title = "Article title",
            ExternalLinkUrl = "https://tisoroglobal.com/article",
        };

        var body = LinkedInApiClient.BuildPostBody(spec);

        Assert.Equal("https://tisoroglobal.com/article", body["content"]!["article"]!["source"]!.GetValue<string>());
        Assert.Equal("Article title", body["content"]!["article"]!["title"]!.GetValue<string>());
    }
}
