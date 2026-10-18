using System.Net;
using System.Text.RegularExpressions;
using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;
using XDashboard.Api.Services.X;

namespace XDashboard.Api.Services.Real;

/// <summary>
/// Backs the Shorts page by treating a "short" as a video post on X: caption, description, and
/// hashtags are folded into the post's 280-character text, and the clip is the post's attached
/// video. Reconstructing caption/description/hashtags back out of a fetched post's text is a
/// best-effort split (see ParseShortText) since X does not store them as separate fields --
/// there is no dedicated "Shorts" API.
/// </summary>
public class RealShortStore : IShortStore
{
    private const int TimelinePageSize = 100;
    private static readonly Regex HashtagPattern = new(@"#(\w+)", RegexOptions.Compiled);
    private static readonly Regex TrailingHashtagLinePattern = new(@"(\r?\n\r?\n)?(#\w+\s*)+$", RegexOptions.Compiled);

    private readonly IXApiClient _xApiClient;

    public RealShortStore(IXApiClient xApiClient)
    {
        _xApiClient = xApiClient;
    }

    public async Task<IReadOnlyList<Short>> GetShortsAsync(CancellationToken cancellationToken = default)
    {
        var me = await _xApiClient.GetMeAsync(cancellationToken);
        var page = await _xApiClient.GetUserTweetsAsync(me.Id, null, TimelinePageSize, cancellationToken);

        return page.Tweets
            .Where(tweet => RealPostStore.IsVideoTweet(tweet, page.MediaByKey))
            .Select(tweet => MapToShort(tweet, page.MediaByKey))
            .OrderByDescending(s => s.CreatedAt)
            .ToList();
    }

    public async Task<Short?> GetShortByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _xApiClient.GetTweetAsync(id, cancellationToken);
        if (result is null)
        {
            return null;
        }

        var (tweet, mediaByKey) = result.Value;
        return MapToShort(tweet, mediaByKey);
    }

    public async Task<Short> CreateShortAsync(CreateShortRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.MediaId))
        {
            throw new XFeatureNotSupportedException(
                "Upload a video via POST /api/media before creating a short.");
        }

        var text = ComposeShortText(request.Caption, request.Description, request.Hashtags);
        var created = await _xApiClient.CreateTweetAsync(text, new[] { request.MediaId }, cancellationToken);

        var result = await _xApiClient.GetTweetAsync(created.Id, cancellationToken);
        if (result is null)
        {
            return new Short
            {
                Id = created.Id,
                Caption = request.Caption,
                Description = request.Description,
                Hashtags = request.Hashtags,
                CreatedAt = DateTimeOffset.UtcNow,
            };
        }

        var (tweet, mediaByKey) = result.Value;
        return MapToShort(tweet, mediaByKey);
    }

    public async Task<bool> DeleteShortAsync(string id, CancellationToken cancellationToken = default)
    {
        try
        {
            await _xApiClient.DeleteTweetAsync(id, cancellationToken);
            return true;
        }
        catch (XApiException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    internal static string ComposeShortText(string caption, string description, List<string> hashtags)
    {
        var parts = new List<string> { caption.Trim() };
        if (!string.IsNullOrWhiteSpace(description))
        {
            parts.Add(description.Trim());
        }

        if (hashtags.Count > 0)
        {
            parts.Add(string.Join(' ', hashtags.Select(tag => $"#{tag}")));
        }

        var text = string.Join("\n\n", parts);
        return text.Length > 280 ? text[..280] : text;
    }

    internal static (string Caption, string Description, List<string> Hashtags) ParseShortText(string text)
    {
        var hashtags = HashtagPattern.Matches(text).Select(m => m.Groups[1].Value).ToList();
        var withoutHashtagLine = TrailingHashtagLinePattern.Replace(text, string.Empty).TrimEnd();
        var segments = withoutHashtagLine.Split("\n\n", 2, StringSplitOptions.None);

        var caption = segments.Length > 0 ? segments[0].Trim() : string.Empty;
        var description = segments.Length > 1 ? segments[1].Trim() : string.Empty;
        return (caption, description, hashtags);
    }

    private static Short MapToShort(XTweet tweet, Dictionary<string, XMedia> mediaByKey)
    {
        XMedia? videoMedia = null;
        if (tweet.Attachments?.MediaKeys is not null)
        {
            foreach (var key in tweet.Attachments.MediaKeys)
            {
                if (mediaByKey.TryGetValue(key, out var media) && (media.Type == "video" || media.Type == "animated_gif"))
                {
                    videoMedia = media;
                    break;
                }
            }
        }

        var bestVariant = videoMedia?.Variants?
            .Where(v => string.Equals(v.ContentType, "video/mp4", StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(v => v.BitRate ?? 0)
            .FirstOrDefault();

        var (caption, description, hashtags) = ParseShortText(tweet.Text);

        return new Short
        {
            Id = tweet.Id,
            VideoUrl = bestVariant?.Url ?? videoMedia?.Url ?? string.Empty,
            ThumbnailUrl = videoMedia?.PreviewImageUrl ?? string.Empty,
            Caption = caption,
            Description = description,
            Hashtags = hashtags,
            CreatedAt = tweet.CreatedAt,
            Views = tweet.PublicMetrics?.ImpressionCount ?? 0,
            Likes = tweet.PublicMetrics?.LikeCount ?? 0,
            Duration = videoMedia?.DurationMs is int ms ? TimeSpan.FromMilliseconds(ms) : TimeSpan.Zero,
        };
    }
}
