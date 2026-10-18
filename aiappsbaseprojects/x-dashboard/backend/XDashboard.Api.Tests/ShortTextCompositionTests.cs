using XDashboard.Api.Services.Real;

namespace XDashboard.Api.Tests;

/// <summary>
/// RealShortStore folds caption/description/hashtags into one X post's text (X has no separate
/// "short" fields) and best-effort splits them back out when reading a post back. These tests
/// pin down that round trip without needing any network access.
/// </summary>
public class ShortTextCompositionTests
{
    [Fact]
    public void ComposeAndParse_RoundTripsCaptionDescriptionAndHashtags()
    {
        var text = RealShortStore.ComposeShortText(
            "Catchy caption",
            "A longer description of the clip.",
            new List<string> { "design", "startup" });

        var (caption, description, hashtags) = RealShortStore.ParseShortText(text);

        Assert.Equal("Catchy caption", caption);
        Assert.Equal("A longer description of the clip.", description);
        Assert.Equal(new[] { "design", "startup" }, hashtags);
    }

    [Fact]
    public void ComposeAndParse_RoundTripsWithNoDescriptionOrHashtags()
    {
        var text = RealShortStore.ComposeShortText("Just a caption", string.Empty, new List<string>());

        var (caption, description, hashtags) = RealShortStore.ParseShortText(text);

        Assert.Equal("Just a caption", caption);
        Assert.Equal(string.Empty, description);
        Assert.Empty(hashtags);
    }

    [Fact]
    public void ComposeShortText_TruncatesToTweetLength()
    {
        var longCaption = new string('a', 400);

        var text = RealShortStore.ComposeShortText(longCaption, string.Empty, new List<string>());

        Assert.Equal(280, text.Length);
    }

    [Fact]
    public void ParseShortText_ExtractsHashtagsAnywhereInText()
    {
        var (_, _, hashtags) = RealShortStore.ParseShortText("Caption only\n\nDescription with #inline and #trailing");

        Assert.Equal(new[] { "inline", "trailing" }, hashtags);
    }
}
